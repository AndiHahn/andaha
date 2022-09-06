#nullable enable

using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Commands.CreateBill;

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

        var newBill = this.dbContext.Bill.Add(
            new Bill(userId, request.CategoryId, request.ShopName, request.Price, request.Date, request.Notes));

        await this.dbContext.SaveChangesAsync(cancellationToken);

        var bill = await this.dbContext.Bill
            .Include(bill => bill.Category)
            .SingleAsync(bill => bill.Id == newBill.Entity.Id, cancellationToken);

        return bill.ToDto();
    }
}
