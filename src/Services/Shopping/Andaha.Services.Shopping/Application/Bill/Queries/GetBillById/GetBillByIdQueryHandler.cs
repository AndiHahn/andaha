using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Application.Services;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Queries.GetBillById;

internal class GetBillByIdQueryHandler : IRequestHandler<GetBillByIdQuery, Result<BillDto>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationService collaborationService;

    public GetBillByIdQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationService collaborationService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationService = collaborationService ?? throw new ArgumentNullException(nameof(collaborationService));
    }

    public async Task<Result<BillDto>> Handle(GetBillByIdQuery request, CancellationToken cancellationToken)
    {
        await this.collaborationService.SetConnectedUsersAsync(cancellationToken);

        var bill = await this.dbContext.Bill
            .Include(bill => bill.Category)
            .FirstOrDefaultAsync(bill => bill.Id == request.BillId, cancellationToken);

        if (bill is null)
        {
            return Result<BillDto>.NotFound($"Bill with id {request.BillId} not found.");
        }

        Guid userId = this.identityService.GetUserId();
        if (bill.UserId != userId)
        {
            return Result<BillDto>.Forbidden();
        }

        return bill.ToDto();
    }
}
