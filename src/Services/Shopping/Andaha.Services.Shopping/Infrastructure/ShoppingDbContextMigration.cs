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
            var categories = group.OrderBy(category => category.Order).ToList();

            if (categories.DistinctBy(category => category.Order).Count() == categories.Count)
            {
                continue;
            }

            for (int i = 0; i < categories.Count; i++)
            {
                var categoryWithOrder = categories[i];

                if (categoryWithOrder.Order != i)
                {
                    var nextCategory = categories.First(category => category.Order == 0 || category.Order > i);

                    nextCategory.UpdateOrder(i);
                }
            }
        }

        await context.SaveChangesAsync();
    }
}
