using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class AnalyzedBill : Entity<Guid>
{
    private AnalyzedBill()
    {
    }

    public AnalyzedBill(
        Guid createdByUserId,
        Guid? categoryId,
        Guid? subCategoryId,
        string shopName,
        double price,
        DateTime? date = null)
        : base(Guid.NewGuid())
    {
        if (createdByUserId == Guid.Empty)
        {
            throw new ArgumentException("Parameter must not be empty.", nameof(createdByUserId));
        }
                
        this.UserId = createdByUserId;
        this.CategoryId = categoryId;
        this.SubCategoryId = subCategoryId;
        this.ShopName = shopName;
        this.Price = price;
        this.Date = date ?? DateTime.UtcNow;
    }

    public Guid UserId { get; private set; }

    public Guid? CategoryId { get; private set; }

    public Guid? SubCategoryId { get; private set; }

    public string? ShopName { get; private set; } = null!;

    public double? Price { get; private set; }

    public DateTime? Date { get; private set; }

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public virtual ICollection<BillImage> Images { get; private set; } = [];

    public virtual ICollection<AnalyzedBillLineItem> LineItems { get; private set; } = [];

    public void AddImage(string imageName, byte[] thumbnail)
    {
        this.Images.Add(new BillImage(this.Id, imageName, thumbnail));
    }

    public void AddLineItem(string? description, double? unitPrice, double? totalPrice, int? quantity)
    {
        this.LineItems.Add(new AnalyzedBillLineItem(Id, description, unitPrice, totalPrice, quantity));
    }

    public void RemoveLineItem(AnalyzedBillLineItem lineItem)
    {
        this.LineItems.Remove(lineItem);
    }
}
