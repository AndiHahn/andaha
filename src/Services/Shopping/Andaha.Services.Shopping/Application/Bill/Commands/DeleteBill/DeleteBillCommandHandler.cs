using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepository;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Commands.DeleteBill;

internal class DeleteBillCommandHandler : IRequestHandler<DeleteBillCommand, Result>
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

    public async Task<Result> Handle(DeleteBillCommand request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var bill = await this.dbContext.Bill
            .Include(bill => bill.Images)
            .FirstOrDefaultAsync(bill => bill.Id == request.BillId, cancellationToken);
        if (bill is null)
        {
            return Result.NotFound($"Bill with id {request.BillId} not found.");
        }

        if (bill.UserId != userId && !connectedUsers.Contains(userId))
        {
            return Result.Forbidden($"User do not have access to bill.");
        }

        this.dbContext.Bill.Remove(bill);

        if (bill.Images.Any())
        {
            string imageName = bill.Images.First().Name;

            await this.imageRepository.DeleteImageAsync(imageName, cancellationToken);
        }

        await this.dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
