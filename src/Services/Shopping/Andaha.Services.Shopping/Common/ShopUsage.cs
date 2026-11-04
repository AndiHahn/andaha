using Andaha.Services.Shopping.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Common;

internal readonly record struct ShopUsage(
    string ShopName,
    Guid CategoryId,
    Guid? SubCategoryId,
    int Count,
    DateTime LastUsed);

internal static class ShopUsageQuery
{
    /// <summary>
    /// Groups the own bills of a user since <paramref name="since"/> by shop (trimmed, case-insensitive),
    /// category and sub category. The spelling of a group is its most frequent original spelling.
    /// </summary>
    internal static async Task<List<ShopUsage>> GetAsync(
        ShoppingDbContext dbContext,
        Guid userId,
        DateTime since,
        CancellationToken cancellationToken)
    {
        // Grouped in the database by the trimmed spelling; the case-insensitive merge happens in memory
        // (the data volume per user is small).
        var spellings = await dbContext.Bill
            .AsNoTracking()
            .Where(bill => bill.UserId == userId && bill.Date >= since)
            .GroupBy(bill => new { ShopName = bill.ShopName.Trim(), bill.CategoryId, bill.SubCategoryId })
            .Select(group => new
            {
                group.Key.ShopName,
                group.Key.CategoryId,
                group.Key.SubCategoryId,
                Count = group.Count(),
                LastUsed = group.Max(bill => bill.Date),
            })
            .ToListAsync(cancellationToken);

        return spellings
            .Where(spelling => spelling.ShopName.Length > 0)
            .GroupBy(spelling => (spelling.ShopName.ToLowerInvariant(), spelling.CategoryId, spelling.SubCategoryId))
            .Select(group => new ShopUsage(
                group.OrderByDescending(spelling => spelling.Count)
                    .ThenByDescending(spelling => spelling.LastUsed)
                    .First().ShopName,
                group.Key.CategoryId,
                group.Key.SubCategoryId,
                group.Sum(spelling => spelling.Count),
                group.Max(spelling => spelling.LastUsed)))
            .OrderByDescending(usage => usage.Count)
            .ThenByDescending(usage => usage.LastUsed)
            .ToList();
    }
}
