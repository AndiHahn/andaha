using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;
using MediatR;

namespace Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;

internal class CreateBillCommandHandler : IRequestHandler<CreateBillCommand, IResult>
{
    private readonly ISender sender;
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public CreateBillCommandHandler(
        ISender sender,
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.sender = sender ?? throw new ArgumentNullException(nameof(sender));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(CreateBillCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var newBill = dbContext.Bill.Add(
            new Core.Bill(
                request.Id,
                userId,
                request.CategoryId,
                request.SubCategoryId,
                request.ShopName,
                request.Price,
                request.Date,
                request.Notes));

        await dbContext.SaveChangesAsync(cancellationToken);

        if (request.Image is not null)
        {
            var command = new UploadBillImageCommand(newBill.Entity.Id, request.Image);

            await sender.Send(command, cancellationToken);
        }

        var bill = await dbContext.FindBillDtoByIdAsync(newBill.Entity.Id, userId, cancellationToken);

        return Results.Ok(bill);
    }
}
