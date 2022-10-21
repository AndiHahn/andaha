using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Queries.GetBillById;

internal class GetBillByIdQueryHandler : IRequestHandler<GetBillByIdQuery, Result<BillDto>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetBillByIdQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<Result<BillDto>> Handle(GetBillByIdQuery request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var bill = await this.dbContext.Bill
            .Include(bill => bill.Category)
            .FirstOrDefaultAsync(bill => bill.Id == request.BillId, cancellationToken);

        if (bill is null)
        {
            return Result<BillDto>.NotFound($"Bill with id {request.BillId} not found.");
        }

        if (bill.UserId != userId && !connectedUsers.Contains(userId))
        {
            return Result<BillDto>.Forbidden($"User do not have access to bill.");
        }

        return bill.ToDto(userId);
    }
}
