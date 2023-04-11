using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillCategory.DeleteBillCategory.V1;

internal class DeleteBillCategoryCommandHandler : IRequestHandler<DeleteBillCategoryCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public DeleteBillCategoryCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(DeleteBillCategoryCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var category = await dbContext.BillCategory
            .SingleAsync(category => category.Id == request.Id, cancellationToken);

        dbContext.BillCategory.Remove(category);

        await UpdateBillsForDeletedCategoryAsync(userId, request.Id, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private async Task UpdateBillsForDeletedCategoryAsync(
        Guid userId,
        Guid removedCategoryId,
        CancellationToken cancellationToken)
    {
        var billsWithRemovedCategory = await this.dbContext.Bill
            .Where(bill => bill.UserId == userId &&
                           bill.CategoryId == removedCategoryId)
            .ToListAsync(cancellationToken);

        var defaultCategory = await this.dbContext.BillCategory
            .Where(category => category.UserId == userId)
            .SingleAsync(category => category.IsDefault, cancellationToken);

        foreach (var bill in billsWithRemovedCategory)
        {
            bill.UpdateCategory(defaultCategory);
        }
    }
}
