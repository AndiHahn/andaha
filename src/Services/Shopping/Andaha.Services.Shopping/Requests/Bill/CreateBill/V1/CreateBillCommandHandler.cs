using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;

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

        if (request.Id is Guid requestedId)
        {
            var existing = await dbContext.Bill
                .Include(b => b.Images)
                .SingleOrDefaultAsync(b => b.Id == requestedId, cancellationToken);

            // Idempotent retry: the existing bill is returned unchanged, line items included (request.LineItems is ignored).
            if (existing is not null)
            {
                if (!existing.HasCreated(userId))
                {
                    return Results.Conflict();
                }

                if (request.Image is not null && !existing.Images.Any())
                {
                    await sender.Send(new UploadBillImageCommand(existing.Id, request.Image), cancellationToken);
                }

                var existingDto = await dbContext.FindBillDtoByIdAsync(existing.Id, userId, cancellationToken);

                return Results.Ok(existingDto);
            }
        }

        var newBill = new Core.Bill(
            request.Id,
            userId,
            request.CategoryId,
            request.SubCategoryId,
            request.ShopName,
            request.Price,
            request.Date,
            request.Notes);

        if (request.LineItems is not null)
        {
            newBill.ReplaceLineItems(request.LineItems);
        }

        dbContext.Bill.Add(newBill);

        await dbContext.SaveChangesAsync(cancellationToken);

        if (request.Image is not null)
        {
            var command = new UploadBillImageCommand(newBill.Id, request.Image);

            await sender.Send(command, cancellationToken);
        }

        var bill = await dbContext.FindBillDtoByIdAsync(newBill.Id, userId, cancellationToken);

        return Results.Ok(bill);
    }
}
