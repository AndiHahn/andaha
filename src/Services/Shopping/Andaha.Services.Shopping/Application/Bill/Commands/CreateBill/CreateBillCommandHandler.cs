using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Application.Bill;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;

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
            new Core.Bill(request.Id, userId, request.CategoryId, request.ShopName, request.Price, request.Date, request.Notes));

        await this.dbContext.SaveChangesAsync(cancellationToken);

        return await this.dbContext.FindBillDtoByIdAsync(newBill.Entity.Id, userId, cancellationToken);
    }
}
