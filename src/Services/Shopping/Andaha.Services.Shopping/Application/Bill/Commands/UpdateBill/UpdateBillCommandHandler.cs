using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Bill.Commands.UpdateBill;

internal class UpdateBillCommandHandler : IRequestHandler<UpdateBillCommand, Result<BillDto>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateBillCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<Result<BillDto>> Handle(UpdateBillCommand request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var bill = await this.dbContext.Bill.FindByIdAsync(request.Id, cancellationToken);
        if (bill is null)
        {
            return Result<BillDto>.NotFound($"Bill with id {request.Id} not found.");
        }

        if (bill.UserId != userId)
        {
            return Result<BillDto>.Forbidden($"User do not have access to bill.");
        }

        bill.Update(request.CategoryId, request.ShopName, request.Price, request.Date, request.Notes);

        await this.dbContext.SaveChangesAsync(cancellationToken);

        var updatedBill = await this.dbContext.Bill
            .Include(billDb => billDb.Category)
            .SingleAsync(
                billDb => billDb.Id == bill.Id &&
                          billDb.UserId == userId,
                cancellationToken);

        return bill.ToDto(userId);
    }
}
