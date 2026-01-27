using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.DeleteBill.V1;

internal class DeleteBillCommandHandler : IRequestHandler<DeleteBillCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IImageRepository imageRepository;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public DeleteBillCommandHandler(
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

    public async Task<IResult> Handle(DeleteBillCommand request, CancellationToken cancellationToken)
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

        if (bill.UserId != userId && !connectedUsers.Contains(userId))
        {
            return Results.Forbid();
        }

        dbContext.Bill.Remove(bill);

        if (bill.Images.Any())
        {
            string imageName = bill.Images.First().Name;

            await imageRepository.DeleteImageAsync(imageName, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
