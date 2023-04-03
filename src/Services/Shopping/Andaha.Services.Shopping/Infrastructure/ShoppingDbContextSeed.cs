using Andaha.Services.Shopping.Core;

namespace Andaha.Services.Shopping.Infrastructure;

public static class ShoppingDbContextSeed
{
    public static IReadOnlyCollection<BillCategory> CreateInitialCategories(Guid userId)
    {
        var categories = new List<BillCategory>
        {
            new(userId, "Keine", "white", 0, Array.Empty<(string, int)>(), isDefault: true),
            new(userId, "Lebensmittel", "red", 1, Array.Empty<(string, int)>()),
            new(userId, "Wohnen", "pink", 2, Array.Empty<(string, int)>()),
            new(userId, "Kleidung", "purple", 3, Array.Empty<(string, int)>()),
            new(userId, "Ausbildung", "yellow", 4, Array.Empty<(string, int)>()),
            new(userId, "Freizeit", "indigo", 5, Array.Empty<(string, int)>()),
            new(userId, "Auto/Motorrad", "orange", 6, Array.Empty<(string, int)>()),
            new(userId, "Hygiene/Gesundheit", "brown", 7, Array.Empty<(string, int)>()),
            new(userId, "Geschenke", "grey", 8, Array.Empty<(string, int)>()),
            new(userId, "Restaurant", "magenta", 9, Array.Empty<(string, int)>()),
        };

        return categories;
    }
}
