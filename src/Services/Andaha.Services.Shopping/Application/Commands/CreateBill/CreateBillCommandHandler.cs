using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Core;
using MediatR;
using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Dtos;

#nullable enable

namespace Andaha.Services.Shopping.Application.CreateBill;

internal class CreateBillCommandHandler : IRequestHandler<CreateBillCommand, Result<BillDto>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public CreateBillCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<Result<BillDto>> Handle(CreateBillCommand request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var bill = this.dbContext.Bill.Add(
            new Bill(userId, request.CategoryId, request.ShopName, request.Price, request.Notes));

        await this.dbContext.SaveChangesAsync(cancellationToken);

        return bill.Entity.ToDto();
    }
}
