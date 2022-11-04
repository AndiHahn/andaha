using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Application.Bill.Commands.UploadBillImage;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;

namespace Andaha.Services.Shopping.Application.Bill.Commands.UpdateBill;

internal class UpdateBillCommandHandler : IRequestHandler<UpdateBillCommand, Result<BillDto>>
{
    private readonly ISender sender;
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateBillCommandHandler(
        ISender sender,
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.sender = sender ?? throw new ArgumentNullException(nameof(sender));
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

        if (request.Image is not null)
        {
            var command = new UploadBillImageCommand(bill.Id, request.Image);

            await this.sender.Send(command, cancellationToken);
        }

        return await this.dbContext.FindBillDtoByIdAsync(bill.Id, userId, cancellationToken);
    }
}
