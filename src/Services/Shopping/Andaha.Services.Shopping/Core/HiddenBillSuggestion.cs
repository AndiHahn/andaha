using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class HiddenBillSuggestion : Entity<Guid>
{
    private HiddenBillSuggestion()
    {
    }

    public HiddenBillSuggestion(Guid userId, string shopName, Guid categoryId, Guid? subCategoryId)
        : base(Guid.NewGuid())
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId must not be empty.", nameof(userId));
        }

        var normalizedShopName = shopName?.Trim();

        if (string.IsNullOrEmpty(normalizedShopName))
        {
            throw new ArgumentException("Shop name must not be empty.", nameof(shopName));
        }

        if (normalizedShopName.Length > 200)
        {
            throw new ArgumentException("Length of shop name must not be > 200 characters.", nameof(shopName));
        }

        this.UserId = userId;
        this.ShopName = normalizedShopName;
        this.CategoryId = categoryId;
        this.SubCategoryId = subCategoryId;
    }

    public Guid UserId { get; private set; }

    /// <summary>
    /// Stored trimmed; comparisons are case-insensitive.
    /// </summary>
    public string ShopName { get; private set; } = null!;

    public Guid CategoryId { get; private set; }

    public Guid? SubCategoryId { get; private set; }

    public BillCategory Category { get; private set; } = null!;

    public BillSubCategory? SubCategory { get; private set; }
}
