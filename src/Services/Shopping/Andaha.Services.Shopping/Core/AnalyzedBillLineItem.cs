using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class AnalyzedBillLineItem : Entity<Guid>
{
    private AnalyzedBillLineItem()
    {
    }

    public AnalyzedBillLineItem(
        Guid billId,
        string description,
        double unitPrice,
        double totalPrice,
        int quantity)
        : base(Guid.NewGuid())
    {
        if (string.IsNullOrEmpty(description))
        {
            throw new ArgumentNullException(nameof(description));
        }

        if (unitPrice < 0)
        {
            throw new ArgumentException("Unit price must not be negative.", nameof(unitPrice));
        }

        if (totalPrice < 0)
        {
            throw new ArgumentException("Total price must not be negative.", nameof(totalPrice));
        }

        if (quantity < 0)
        {
            throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));
        }

        this.BillId = billId;
        this.Description = description;
        this.UnitPrice = unitPrice;
        this.TotalPrice = totalPrice;
        this.Quantity = quantity;
    }

    public Guid BillId { get; private set; }

    public string? Description { get; set; }

    public int? Quantity { get; set; }

    public double? UnitPrice { get; set; }

    public double? TotalPrice { get; set; }

    public AnalyzedBill Bill { get; private set; } = null!;

    public void Update(
        string? description = null,
        double? unitPrice = null,
        double? totalPrice = null,
        int? quantity = null)
    {
        this.Description = description ?? this.Description;
        this.UnitPrice = unitPrice ?? this.UnitPrice;
        this.TotalPrice = totalPrice ?? this.TotalPrice;
        this.Quantity = quantity ?? this.Quantity;
    }
}
