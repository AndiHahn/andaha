namespace Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;

public class InvoiceAnalysisResult
{
    public string? InvoiceId { get; set; }
    public string? VendorName { get; set; }
    public string? CustomerName { get; set; }
    public DateTimeOffset? InvoiceDate { get; set; }
    public double? TotalAmount { get; set; }
    public string? Currency { get; set; }
    public double? TotalAmountConfidence { get; set; }
    public double? Confidence { get; set; }

    public List<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();

    public bool IsReasonableResult()
    {
        return !string.IsNullOrWhiteSpace(VendorName)
            && InvoiceDate.HasValue
            && TotalAmount.HasValue
            && TotalAmount.Value > 0
            && Confidence > 0.75
            && (LineItemSumEqualsTotalAmount() || TotalAmountConfidence > 0.6);
    }

    public bool LineItemSumEqualsTotalAmount()
    {
        if (!TotalAmount.HasValue)
        {
            return false;
        }

        double lineItemsSum = LineItems?.Sum(lineItem => lineItem.TotalPrice) ?? 0.0;

        const double maxTolerance = 5.0;

        return Math.Abs(TotalAmount.Value - lineItemsSum) <= maxTolerance;
    }
}
