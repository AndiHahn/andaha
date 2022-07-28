using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class Bill : Entity<Guid>
{
    private Bill()
    {
    }

    public Bill(
        Guid createdByUserId,
        Guid categoryId,
        string shopName,
        double price,
        string? notes)
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

        this.CreatedByUserId = createdByUserId;
        this.CategoryId = categoryId;
        this.ShopName = shopName;
        this.Price = price;
        this.Date = DateTime.UtcNow;
        this.Notes = notes;
    }

    public Guid CreatedByUserId { get; private set; }

    public Guid CategoryId { get; private set; }

    public string ShopName { get; private set; } = null!;

    public double Price { get; private set; }

    public DateTime Date { get; private set; }

    public string? Notes { get; private set; }

    public BillCategory Category { get; private set; } = null!;

    public bool HasCreated(Guid userId) => this.CreatedByUserId == userId;
}
