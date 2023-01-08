using Andaha.Services.Shopping.Core;

namespace Andaha.Services.Shopping.Infrastructure;

public static class ShoppingDbContextSeed
{
    public static IReadOnlyCollection<BillCategory> CreateInitialCategories(Guid userId)
    {
        var categories = new List<BillCategory>
        {
            new BillCategory(userId, "Keine", "white", Array.Empty<string>(), true),
            new BillCategory(userId, "Lebensmittel", "red", Array.Empty<string>()),
            new BillCategory(userId, "Wohnen", "pink", Array.Empty<string>()),
            new BillCategory(userId, "Kleidung", "purple", Array.Empty<string>()),
            new BillCategory(userId, "Ausbildung", "yellow", Array.Empty<string>()),
            new BillCategory(userId, "Freizeit", "indigo", Array.Empty<string>()),
            new BillCategory(userId, "Auto/Motorrad", "orange", Array.Empty<string>()),
            new BillCategory(userId, "Hygiene/Gesundheit", "brown", Array.Empty<string>()),
            new BillCategory(userId, "Geschenke", "grey", Array.Empty<string>()),
            new BillCategory(userId, "Restaurant", "magenta", Array.Empty<string>()),
        };

        return categories;
    }
}
