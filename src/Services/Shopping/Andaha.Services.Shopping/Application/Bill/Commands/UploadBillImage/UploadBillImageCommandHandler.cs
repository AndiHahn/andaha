using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepository;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Bill.Commands.UploadBillImage;

internal class UploadBillImageCommandHandler : IRequestHandler<UploadBillImageCommand, Result>
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

    public async Task<Result> Handle(UploadBillImageCommand request, CancellationToken cancellationToken)
    {
        var bill = await this.dbContext.Bill
            .Include(bill => bill.Images)
            .FirstOrDefaultAsync(bill => bill.Id == request.BillId, cancellationToken);
        if (bill is null)
        {
            return Result.NotFound($"Bill with id {request.BillId} not found.");
        }

        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);
        if (!bill.HasCreated(userId) && !connectedUsers.Contains(userId))
        {
            return Result.Forbidden("User has no access to bill.");
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

        await this.imageRepository.UploadImageAsync(imageName, imageStream, cancellationToken);

        await this.dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private static string GetImageName(Guid billId, int nrOfExistingImages) => $"{billId}-{nrOfExistingImages + 1}";

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
