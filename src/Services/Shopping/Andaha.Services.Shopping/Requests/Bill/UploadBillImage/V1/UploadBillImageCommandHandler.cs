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
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;
    private readonly IImageRepository imageRepository;
    private readonly ILogger<UploadBillImageCommandHandler> logger;

    public UploadBillImageCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy,
        IImageRepository imageRepository,
        ILogger<UploadBillImageCommandHandler> logger)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
        this.imageRepository = imageRepository ?? throw new ArgumentNullException(nameof(imageRepository));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
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

        // The old blob is deleted only after the new one is written and saved, so a failure never leaves the bill without an image.
        var oldImage = bill.Images.FirstOrDefault();
        string? oldName = oldImage?.Name;
        if (oldImage is not null)
        {
            bill.RemoveImage(oldImage);
        }

        using Stream requestStream = request.Image.OpenReadStream();
        using Stream imageStream = await EnsureSeekableAsync(requestStream, cancellationToken);

        var fileType = await logger.DetectOrWarnAsync(imageStream, $"bill {bill.Id}", cancellationToken);
        string imageName = BillImagePath.ForBill(bill.UserId, bill.Date, bill.ShopName, bill.Id, bill.Images.Count + 1, fileType.Extension);

        bill.AddImage(imageName, []);

        await imageRepository.UploadImageAsync(imageName, imageStream, fileType.ContentType, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        if (oldName is not null && oldName != imageName)
        {
            await TryDeleteOldImageAsync(oldName, cancellationToken);
        }

        return Results.NoContent();
    }

    private async Task TryDeleteOldImageAsync(string oldName, CancellationToken cancellationToken)
    {
        try
        {
            await imageRepository.DeleteImageAsync(oldName, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "The replaced bill image '{ImageName}' could not be deleted.", oldName);
        }
    }

    private static async Task<Stream> EnsureSeekableAsync(Stream stream, CancellationToken cancellationToken)
    {
        if (stream.CanSeek)
        {
            stream.Position = 0;

            return stream;
        }

        var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, cancellationToken);
        buffer.Position = 0;

        return buffer;
    }
}
