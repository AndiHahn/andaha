using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class Bill : Entity<Guid>
{
    private Bill()
    {
    }

    public Bill(
        Guid? id,
        Guid createdByUserId,
        Guid categoryId,
        string shopName,
        double price,
        DateTime? date = null,
        string? notes = null)
        : base(id ?? Guid.NewGuid())
    {
        if (createdByUserId == Guid.Empty)
        {
            throw new ArgumentException("Parameter must not be empty.", nameof(createdByUserId));
        }

        if (categoryId == Guid.Empty)
        {
            throw new ArgumentException("Parameter must not be empty.", nameof(categoryId));
        }

        if (string.IsNullOrEmpty(shopName))
        {
            throw new ArgumentNullException(nameof(shopName));
        }

        if (price < 0)
        {
            throw new ArgumentException("Price must not be negative.", nameof(price));
        }

        if (notes?.Length > 1000)
        {
            throw new ArgumentException("Length of notes must not be > 1000 characters.", nameof(notes));
        }

        this.UserId = createdByUserId;
        this.CategoryId = categoryId;
        this.ShopName = shopName;
        this.Price = price;
        this.Date = date ?? DateTime.UtcNow;
        this.Notes = notes;
    }

    public Guid UserId { get; private set; }

    public Guid CategoryId { get; private set; }

    public string ShopName { get; private set; } = null!;

    public double Price { get; private set; }

    public DateTime Date { get; private set; }

    public string? Notes { get; private set; }

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public BillCategory Category { get; private set; } = null!;

    public virtual ICollection<BillImage> Images { get; private set; } = null!;

    public void AddImage(string imageName, byte[] thumbnail)
    {
        this.Images.Add(new BillImage(this.Id, imageName, thumbnail));
    }

    public void RemoveImage(BillImage image)
    {
        this.Images.Remove(image);
    }

    public bool HasCreated(Guid userId) => this.UserId == userId;

    public void UpdateCategory(BillCategory category)
    {
        this.CategoryId = category.Id;
        this.Category = category;
    }

    public void Update(
        Guid? categoryId = null,
        string? shopName = null,
        double? price = null,
        DateTime? date = null,
        string? notes = null)
    {
        this.CategoryId = categoryId ?? this.CategoryId;
        this.ShopName = shopName ?? this.ShopName;
        this.Price = price ?? this.Price;
        this.Date = date ?? this.Date;
        this.Notes = notes ?? this.Notes;
    }
}
