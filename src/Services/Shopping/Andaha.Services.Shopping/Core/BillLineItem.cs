using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class BillLineItem : Entity<Guid>
{
    private BillLineItem()
    {
    }

    public BillLineItem(
        Guid billId,
        string? description,
        double? unitPrice,
        double? totalPrice,
        int? quantity)
        : base(Guid.NewGuid())
    {
        this.BillId = billId;
        this.Description = description;
        this.UnitPrice = unitPrice;
        this.TotalPrice = totalPrice;
        this.Quantity = quantity;
    }

    public Guid BillId { get; set; }

    public string? Description { get; set; }

    public int? Quantity { get; set; }

    public double? UnitPrice { get; set; }

    public double? TotalPrice { get; set; }

    public Bill Bill { get; private set; } = null!;

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
