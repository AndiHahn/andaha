using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;

namespace Andaha.Services.Shopping.Application.Queries.GetBillById;

internal class GetBillByIdQueryHandler : IRequestHandler<GetBillByIdQuery, Result<BillDto>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public GetBillByIdQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<Result<BillDto>> Handle(GetBillByIdQuery request, CancellationToken cancellationToken)
    {
        var bill = await this.dbContext.Bill.FindByIdAsync(request.BillId, cancellationToken);
        if (bill is null)
        {
            return Result<BillDto>.NotFound($"Bill with id {request.BillId} not found.");
        }

        Guid userId = this.identityService.GetUserId();
        if (bill.CreatedByUserId != userId)
        {
            return Result<BillDto>.Forbidden();
        }

        return bill.ToDto();
    }
}
