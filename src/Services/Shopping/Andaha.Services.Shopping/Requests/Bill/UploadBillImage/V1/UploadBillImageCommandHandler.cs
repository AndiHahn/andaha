using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;

internal class UploadBillImageCommandHandler : IRequestHandler<UploadBillImageCommand, IResult>
{
    private const int thumbnailPixelSize = 60;

    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;
    private readonly IImageRepository imageRepository;

    public UploadBillImageCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy,
        IImageRepository imageRepository)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
        this.imageRepository = imageRepository ?? throw new ArgumentNullException(nameof(imageRepository));
    }

    public async Task<IResult> Handle(UploadBillImageCommand request, CancellationToken cancellationToken)
    {
        var bill = await dbContext.Bill
            .Include(bill => bill.Images)
            .FirstOrDefaultAsync(bill => bill.Id == request.Id, cancellationToken);
        if (bill is null)
        {
            return Results.NotFound($"Bill with id {request.Id} not found.");
        }

        Guid userId = identityService.GetUserId();
        
        if (!bill.HasCreated(userId))
        {
            var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);
            if (!connectedUsers.Contains(bill.UserId))
            {
                return Results.Forbid();
            }
        }

        if (bill.Images.Any())
        {
            bill.RemoveImage(bill.Images.First());
        }

        string imageName = GetImageName(bill.Id, bill.Images.Count);

        using Stream imageStream = request.Image.OpenReadStream();

        using Stream thumbnailStream = ImageResizer.ShrinkProportional(imageStream, thumbnailPixelSize);

        thumbnailStream.Position = 0;
        var thumbnail = ReadStreamToBytes(thumbnailStream);

        bill.AddImage(imageName, thumbnail);

        imageStream.Position = 0;

        await imageRepository.UploadImageAsync(imageName, imageStream, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NotFound();
    }

    private static string GetImageName(Guid billId, int nrOfExistingImages) => $"{billId}-{nrOfExistingImages + 1}";

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
