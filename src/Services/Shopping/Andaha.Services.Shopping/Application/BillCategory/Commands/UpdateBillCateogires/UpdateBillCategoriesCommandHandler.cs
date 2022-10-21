using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.BillCategory.Commands.UpdateBillCateogires;

internal class UpdateBillCategoriesCommandHandler : IRequestHandler<UpdateBillCategoriesCommand, Result>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public UpdateBillCategoriesCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<Result> Handle(UpdateBillCategoriesCommand request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var existingCategories = await this.dbContext.BillCategory
            .Where(category => category.UserId == userId)
            .ToListAsync(cancellationToken);

        var categoriesToCreate = request.Categories.Where(category => category.Id is null);
        var categoriesToUpdate = request.Categories.Except(categoriesToCreate);
        var categoriesToRemove = existingCategories.Where(category => categoriesToUpdate.All(c => c.Id != category.Id));

        foreach (var category in categoriesToCreate)
        {
            this.dbContext.BillCategory.Add(new Core.BillCategory(userId, category.Name, category.Color));
        }

        foreach (var category in categoriesToUpdate)
        {
            var existingCategory = existingCategories.Single(c => c.Id == category.Id!);
            existingCategory.Update(category.Name, category.Color);
        }

        this.dbContext.BillCategory.RemoveRange(categoriesToRemove);

        await UpdateBillsForDeletedCategories(userId, existingCategories, categoriesToRemove, cancellationToken);

        await this.dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private async Task UpdateBillsForDeletedCategories(
        Guid userId,
        IEnumerable<Core.BillCategory> existingCategories,
        IEnumerable<Core.BillCategory> categoriesToRemove,
        CancellationToken cancellationToken)
    {
        var categoriesToRemoveIds = categoriesToRemove.Select(category => category.Id).ToList();
        if (!categoriesToRemoveIds.Any())
        {
            return;
        }

        var billsWithRemovedCategory = await this.dbContext.Bill
            .Where(bill => bill.UserId == userId &&
                           categoriesToRemoveIds.Contains(bill.CategoryId))
            .ToListAsync(cancellationToken);

        var defaultCategory = existingCategories.Single(category => category.IsDefault);

        foreach (var bill in billsWithRemovedCategory)
        {
            bill.UpdateCategory(defaultCategory);
        }
    }
}
