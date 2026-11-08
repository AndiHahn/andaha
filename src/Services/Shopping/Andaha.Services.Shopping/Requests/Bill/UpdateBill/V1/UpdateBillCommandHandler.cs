using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;
using MediatR;

namespace Andaha.Services.Shopping.Requests.Bill.UpdateBill.V1;

internal class UpdateBillCommandHandler : IRequestHandler<UpdateBillCommand, IResult>
{
    private readonly ISender sender;
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;
    private readonly IImageRepository imageRepository;
    private readonly ILogger<UpdateBillCommandHandler> logger;

    public UpdateBillCommandHandler(
        ISender sender,
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy,
        IImageRepository imageRepository,
        ILogger<UpdateBillCommandHandler> logger)
    {
        this.sender = sender ?? throw new ArgumentNullException(nameof(sender));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
        this.imageRepository = imageRepository ?? throw new ArgumentNullException(nameof(imageRepository));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IResult> Handle(UpdateBillCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var bill = await dbContext.Bill.FindByIdAsync(request.Id, cancellationToken);
        if (bill is null)
        {
            return Results.NotFound($"Bill with id {request.Id} not found.");
        }

        if (bill.UserId != userId)
        {
            var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);
            if (!connectedUsers.Contains(bill.UserId))
            {
                return Results.Forbid();
            }
        }

        bill.Update(request.CategoryId, request.SubCategoryId, request.ShopName, request.Price, request.Date, request.Notes);

        // Without the lineItems field the stored items stay unchanged; with it they are replaced ([] removes them).
        if (request.LineItems is not null)
        {
            await dbContext.Entry(bill).Collection(b => b.LineItems).LoadAsync(cancellationToken);

            bill.ReplaceLineItems(request.LineItems);
        }

        // A new image goes through UploadBillImage, which writes the structured path and deletes the old blob.
        // Otherwise existing images follow the bill to its new path (date or shop changed).
        IReadOnlyList<string> movedOldNames = [];
        if (request.Image is null)
        {
            await dbContext.Entry(bill).Collection(b => b.Images).LoadAsync(cancellationToken);

            try
            {
                movedOldNames = await BillImageMover.CopyToNewPathsAsync(bill, imageRepository, cancellationToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogError(exception, "The image of bill {BillId} could not be moved; the bill was not updated.", bill.Id);

                return Results.Problem("The bill image could not be moved to its new location.", statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        await BillImageMover.DeleteOldAsync(movedOldNames, imageRepository, logger, cancellationToken);

        if (request.Image is not null)
        {
            var command = new UploadBillImageCommand(bill.Id, request.Image);

            await sender.Send(command, cancellationToken);
        }

        var updatedBill = await dbContext.FindBillDtoByIdAsync(bill.Id, userId, cancellationToken);

        return updatedBill is null
            ? Results.NotFound($"Bill with id {bill.Id} not found.")
            : Results.Ok(updatedBill);
    }
}
