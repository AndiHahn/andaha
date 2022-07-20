using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Infrastructure;

public static class ShoppingDbContextSeed
{
    public static async Task SeedAsync(ShoppingDbContext context)
    {
        if (!await context.BillCategory.AnyAsync())
        {
            await PopulateCategoriesAsync(context);
        }
    }

    private static Task PopulateCategoriesAsync(ShoppingDbContext context)
    {
        context.BillCategory.Add(new BillCategory("Lebensmittel", "red"));
        context.BillCategory.Add(new BillCategory("Wohnen", "pink"));
        context.BillCategory.Add(new BillCategory("Kleidung", "purple"));
        context.BillCategory.Add(new BillCategory("Ausbildung", "yellow"));
        context.BillCategory.Add(new BillCategory("Freizeit", "indigo"));
        context.BillCategory.Add(new BillCategory("Auto/Motorrad", "orange"));
        context.BillCategory.Add(new BillCategory("Hygiene/Gesundheit", "brown"));
        context.BillCategory.Add(new BillCategory("Geschenke", "grey"));
        context.BillCategory.Add(new BillCategory("Restaurant", "magenta"));

        return context.SaveChangesAsync();
    }
}
