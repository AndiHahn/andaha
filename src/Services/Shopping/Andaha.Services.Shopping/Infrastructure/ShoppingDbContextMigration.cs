using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Infrastructure;

public static class ShoppingDbContextMigration
{
    public static async Task MigrateCategoryOrderAsync(this ShoppingDbContext context)
    {
        var categoriesByUser = await context.BillCategory
            .GroupBy(category => category.UserId)
            .ToListAsync();

        foreach (var group in categoriesByUser)
        {
            var categories = group
                .OrderBy(category => category.Order)
                .ThenByDescending(category => category.IsDefault)
                .ToList();

            if (categories.DistinctBy(category => category.Order).Count() == categories.Count)
            {
                continue;
            }

            for (int i = 0; i < categories.Count; i++)
            {
                var categoryWithOrder = categories[i];

                if (categoryWithOrder.Order != i)
                {
                    var nextCategory = categories
                        .Where((category, index) => index >= i && (category.Order == 0 || category.Order > i))
                        .First();

                    nextCategory.UpdateOrder(i);
                }
            }
        }

        await context.SaveChangesAsync();
    }

    public static async Task MigrateSubCategoryOrderAsync(this ShoppingDbContext context)
    {
        var subCategoriesByUser = await context.BillSubCategory
            .GroupBy(subCategory => subCategory.CategoryId)
            .ToListAsync();

        foreach (var group in subCategoriesByUser)
        {
            var subCategories = group.OrderBy(category => category.Order).ToList();

            if (subCategories.DistinctBy(category => category.Order).Count() == subCategories.Count)
            {
                continue;
            }

            for (int i = 0; i < subCategories.Count; i++)
            {
                var subCategoryWithOrder = subCategories[i];

                if (subCategoryWithOrder.Order != i)
                {
                    var nextCategory = subCategories
                        .Where((category, index) => index >= i && (category.Order == 0 || category.Order > i))
                        .First();

                    nextCategory.UpdateOrder(i);
                }
            }
        }

        await context.SaveChangesAsync();
    }
}
