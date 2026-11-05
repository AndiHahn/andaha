namespace Andaha.Services.Shopping.Requests.Bill.LineItems;

/// <summary>
/// Cleans recognized line items before they are stored (US-0009 §5.1): a single badly recognized item must not
/// block a whole bill.
/// </summary>
public static class LineItemSanitizer
{
    /// <summary>
    /// Trims descriptions, drops items without a description, cuts descriptions to
    /// <see cref="LineItemData.MaxDescriptionLength"/> characters and turns a quantity of 0 or less into <c>null</c>.
    /// Prices stay unchanged, negative ones included (discount, deposit). The order is kept.
    /// </summary>
    public static IReadOnlyList<LineItemData> Sanitize(
        IEnumerable<(string? Description, int? Quantity, double? UnitPrice, double? TotalPrice)> raw)
    {
        ArgumentNullException.ThrowIfNull(raw);

        var result = new List<LineItemData>();

        foreach (var (description, quantity, unitPrice, totalPrice) in raw)
        {
            string trimmed = description?.Trim() ?? string.Empty;
            if (trimmed.Length == 0)
            {
                continue;
            }

            if (trimmed.Length > LineItemData.MaxDescriptionLength)
            {
                trimmed = trimmed[..LineItemData.MaxDescriptionLength];
            }

            result.Add(new LineItemData(trimmed, quantity > 0 ? quantity : null, unitPrice, totalPrice));
        }

        return result;
    }
}
