namespace Andaha.Services.Shopping.Requests.Bill.LineItems;

/// <summary>
/// A bill line item as it comes in (form field <c>lineItems</c>, analysis), in display order.
/// </summary>
public record LineItemData(string Description, int? Quantity, double? UnitPrice, double? TotalPrice)
{
    public const int MaxDescriptionLength = 200;

    public const int MaxCount = 200;
}
