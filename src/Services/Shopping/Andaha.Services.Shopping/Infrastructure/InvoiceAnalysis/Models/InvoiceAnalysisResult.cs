using Andaha.Services.Shopping.Core;

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
    public double? VendorNameConfidence { get; set; }
    public double? InvoiceDateConfidence { get; set; }
    /// <summary>Raw text of the total as read from the document (InvoiceTotal.Content).</summary>
    public string? TotalAmountText { get; set; }

    public List<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();

    public bool IsReasonableResult()
    {
        double lineItemsSum = LineItems?.Sum(lineItem => lineItem.TotalPrice) ?? 0.0;
        int withPrice = LineItems?.Count(lineItem => lineItem.TotalPrice != null) ?? 0;

        return AutoCreationRules.Evaluate(
            new AutoCreationInput(
                VendorName, VendorNameConfidence, InvoiceDate?.DateTime, InvoiceDateConfidence,
                TotalAmount, TotalAmountConfidence, TotalAmountText, Confidence,
                lineItemsSum, withPrice, CategoryValid: true),
            DateTime.UtcNow.Date).Count == 0;
    }
}
