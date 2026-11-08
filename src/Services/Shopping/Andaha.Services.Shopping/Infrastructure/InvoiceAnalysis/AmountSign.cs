using System.Text.RegularExpressions;

namespace Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;

/// <summary>
/// Corrects the sign of a line item amount. Receipts print discounts as "1,00-"; the
/// recognizer often returns the value without the sign, so the raw text decides.
/// </summary>
public static partial class AmountSign
{
    // Leading minus, or a minus directly after a digit at the end. "7,-" (flat price) is positive.
    [GeneratedRegex(@"^\s*[-\u2212]|\d\s*[-\u2212]\s*$")]
    private static partial Regex NegativeText();

    public static (double? total, double? unit) Apply(double? totalPrice, double? unitPrice, string? amountContent)
    {
        if (totalPrice is null)
        {
            return (null, unitPrice);
        }

        bool negative = totalPrice < 0
            || (amountContent is not null && NegativeText().IsMatch(amountContent));

        if (!negative)
        {
            return (totalPrice, unitPrice);
        }

        double total = -Math.Abs(totalPrice.Value);
        double? unit = unitPrice is > 0 ? -unitPrice : unitPrice;
        return (total, unit);
    }
}
