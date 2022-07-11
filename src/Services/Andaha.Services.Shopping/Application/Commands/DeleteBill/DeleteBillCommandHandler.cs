﻿using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;

namespace Andaha.Services.Shopping.Application.DeleteBill;

internal class DeleteBillCommandHandler : IRequestHandler<DeleteBillCommand, Result>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public DeleteBillCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<Result> Handle(DeleteBillCommand request, CancellationToken cancellationToken)
    {
        var bill = await this.dbContext.Bill.FindByIdAsync(request.BillId, cancellationToken);
        if (bill is null)
        {
            return Result.NotFound($"Bill with id {request.BillId} not found.");
        }

        Guid userId = this.identityService.GetUserId();
        if (bill.CreatedByUserId != userId)
        {
            return Result.Forbidden($"Current user has no access to bill {request.BillId}");
        }

        this.dbContext.Bill.Remove(bill);

        await this.dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
