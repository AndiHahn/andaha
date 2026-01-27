using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Andaha.CrossCutting.Application.Identity;
using Microsoft.EntityFrameworkCore;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

namespace Andaha.Services.Shopping.Requests.Bill.DeleteBillImage.V1;

internal class DeleteBillImageCommandHandler : IRequestHandler<DeleteBillImageCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IImageRepository imageRepository;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public DeleteBillImageCommandHandler(
        ShoppingDbContext dbContext,
        IImageRepository imageRepository,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.imageRepository = imageRepository ?? throw new ArgumentNullException(nameof(imageRepository));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(DeleteBillImageCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var bill = await dbContext.Bill
            .Include(bill => bill.Images)
            .FirstOrDefaultAsync(bill => bill.Id == request.Id, cancellationToken);
        if (bill is null)
        {
            return Results.NotFound($"Bill with id {request.Id} not found.");
        }

        if (!bill.HasCreated(userId) && !connectedUsers.Contains(userId))
        {
            return Results.Forbid();
        }

        if (bill.Images.Any())
        {
            string imageName = bill.Images.First().Name;

            await imageRepository.DeleteImageAsync(imageName, cancellationToken);
        }

        bill.Images.Clear();

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
