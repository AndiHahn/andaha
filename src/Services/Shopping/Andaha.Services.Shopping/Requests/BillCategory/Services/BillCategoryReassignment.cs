using Andaha.Services.Shopping.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillCategory.Services;

/// <summary>
/// Moves bills out of categories that are about to be deleted, so that no bill is ever deleted
/// through its category (the relation is <c>Restrict</c>).
/// </summary>
internal static class BillCategoryReassignment
{
    /// <summary>
    /// Moves every bill in <paramref name="categoryIds"/>, regardless of which user owns it, to the
    /// default category of its owner and clears its sub category. The default category is never one
    /// of <paramref name="categoryIds"/>. An owner without a default category gets one from the seed:
    /// the full initial set if the owner has no other category left, otherwise only the default.
    /// Changes are tracked only; the caller saves them together with the category deletion.
    /// </summary>
    public static async Task MoveBillsToOwnersDefaultCategoryAsync(
        ShoppingDbContext db,
        IReadOnlyCollection<Guid> categoryIds,
        CancellationToken ct)
    {
        if (categoryIds.Count == 0)
        {
            return;
        }

        var bills = await db.Bill
            .Where(bill => categoryIds.Contains(bill.CategoryId))
            .ToListAsync(ct);

        if (bills.Count == 0)
        {
            return;
        }

        var ownerIds = bills.Select(bill => bill.UserId).Distinct().ToList();

        var remainingCategories = await db.BillCategory
            .Where(category => ownerIds.Contains(category.UserId) && !categoryIds.Contains(category.Id))
            .ToListAsync(ct);

        var defaultCategoryByOwner = new Dictionary<Guid, Core.BillCategory>();

        foreach (var ownerId in ownerIds)
        {
            var ownersCategories = remainingCategories.Where(category => category.UserId == ownerId).ToList();

            var defaultCategory = ownersCategories
                .Where(category => category.IsDefault)
                .OrderBy(category => category.Order)
                .ThenBy(category => category.Id)
                .FirstOrDefault();

            defaultCategory ??= SeedDefaultCategory(db, ownerId, ownerHasOtherCategories: ownersCategories.Count > 0);

            defaultCategoryByOwner[ownerId] = defaultCategory;
        }

        foreach (var bill in bills)
        {
            bill.MoveToCategory(defaultCategoryByOwner[bill.UserId]);
        }
    }

    private static Core.BillCategory SeedDefaultCategory(ShoppingDbContext db, Guid ownerId, bool ownerHasOtherCategories)
    {
        var initialCategories = ShoppingDbContextSeed.CreateInitialCategories(ownerId);
        var defaultCategory = initialCategories.Single(category => category.IsDefault);

        if (ownerHasOtherCategories)
        {
            db.BillCategory.Add(defaultCategory);
        }
        else
        {
            db.BillCategory.AddRange(initialCategories);
        }

        return defaultCategory;
    }
}
