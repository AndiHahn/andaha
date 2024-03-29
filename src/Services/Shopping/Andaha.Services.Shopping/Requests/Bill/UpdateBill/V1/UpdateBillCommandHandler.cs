﻿using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;
using MediatR;

namespace Andaha.Services.Shopping.Requests.Bill.UpdateBill.V1;

internal class UpdateBillCommandHandler : IRequestHandler<UpdateBillCommand, IResult>
{
    private readonly ISender sender;
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public UpdateBillCommandHandler(
        ISender sender,
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.sender = sender ?? throw new ArgumentNullException(nameof(sender));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(UpdateBillCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var bill = await dbContext.Bill.FindByIdAsync(request.Id, cancellationToken);
        if (bill is null)
        {
            return Results.NotFound($"Bill with id {request.Id} not found.");
        }

        if (bill.UserId != userId)
        {
            var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);
            if (!connectedUsers.Contains(bill.UserId))
            {
                return Results.Forbid();
            }
        }

        bill.Update(request.CategoryId, request.SubCategoryId, request.ShopName, request.Price, request.Date, request.Notes);

        await dbContext.SaveChangesAsync(cancellationToken);

        if (request.Image is not null)
        {
            var command = new UploadBillImageCommand(bill.Id, request.Image);

            await sender.Send(command, cancellationToken);
        }

        var updatedBill = await dbContext.FindBillDtoByIdAsync(bill.Id, userId, cancellationToken);

        return Results.Ok(updatedBill);
    }
}
