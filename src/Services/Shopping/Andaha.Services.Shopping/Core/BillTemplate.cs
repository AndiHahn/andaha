using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class BillTemplate : Entity<Guid>
{
    private BillTemplate()
    {
    }

    public BillTemplate(
        Guid userId,
        string? name,
        string? shopName,
        Guid categoryId,
        Guid? subCategoryId,
        int sortOrder)
        : base(Guid.NewGuid())
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId must not be empty.", nameof(userId));
        }

        this.UserId = userId;

        this.Update(name, shopName, categoryId, subCategoryId);
        this.UpdateSortOrder(sortOrder);
    }

    public Guid UserId { get; private set; }

    public string? Name { get; private set; }

    /// <summary>
    /// Null means the shop is chosen when the bill is captured.
    /// </summary>
    public string? ShopName { get; private set; }

    public Guid CategoryId { get; private set; }

    public Guid? SubCategoryId { get; private set; }

    public int SortOrder { get; private set; }

    public BillCategory Category { get; private set; } = null!;

    public BillSubCategory? SubCategory { get; private set; }

    public void Update(string? name, string? shopName, Guid categoryId, Guid? subCategoryId)
    {
        var normalizedName = Normalize(name);
        var normalizedShopName = Normalize(shopName);

        if (normalizedName?.Length > 100)
        {
            throw new ArgumentException("Length of name must not be > 100 characters.", nameof(name));
        }

        if (normalizedShopName?.Length > 200)
        {
            throw new ArgumentException("Length of shop name must not be > 200 characters.", nameof(shopName));
        }

        this.Name = normalizedName;
        this.ShopName = normalizedShopName;
        this.CategoryId = categoryId;
        this.SubCategoryId = subCategoryId;
    }

    public void UpdateSortOrder(int sortOrder)
    {
        if (sortOrder < 0)
        {
            throw new ArgumentException("Sort order must be >= 0.", nameof(sortOrder));
        }

        this.SortOrder = sortOrder;
    }

    public void ClearSubCategory()
    {
        this.SubCategoryId = null;
        this.SubCategory = null;
    }

    private static string? Normalize(string? value)
    {
        var trimmed = value?.Trim();

        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }
}
