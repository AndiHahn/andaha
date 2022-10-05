using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Infrastructure;

public static class ShoppingDbContextSeed
{
    public static IReadOnlyCollection<BillCategory> CreateInitialCategories(Guid userId)
    {
        var categories = new List<BillCategory>
        {
            new BillCategory(userId, "Lebensmittel", "red"),
            new BillCategory(userId, "Wohnen", "pink"),
            new BillCategory(userId, "Kleidung", "purple"),
            new BillCategory(userId, "Ausbildung", "yellow"),
            new BillCategory(userId, "Freizeit", "indigo"),
            new BillCategory(userId, "Auto/Motorrad", "orange"),
            new BillCategory(userId, "Hygiene/Gesundheit", "brown"),
            new BillCategory(userId, "Geschenke", "grey"),
            new BillCategory(userId, "Restaurant", "magenta"),
        };

        return categories;
    }
}
