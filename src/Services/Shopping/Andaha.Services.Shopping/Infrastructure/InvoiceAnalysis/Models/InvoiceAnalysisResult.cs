namespace Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;

public class InvoiceAnalysisResult
{
    public string? InvoiceId { get; set; }
    public string? VendorName { get; set; }
    public string? CustomerName { get; set; }
    public DateTimeOffset? InvoiceDate { get; set; }
    public double? TotalAmount { get; set; }
    public string? Currency { get; set; }

    public List<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();

    public bool IsReasonableResult()
    {
        return !string.IsNullOrWhiteSpace(VendorName)
            && InvoiceDate.HasValue
            && TotalAmount.HasValue
            && TotalAmount.Value > 0;
    }
}
