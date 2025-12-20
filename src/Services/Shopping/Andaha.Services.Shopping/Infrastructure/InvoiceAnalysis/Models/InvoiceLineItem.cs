namespace Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;

public class InvoiceLineItem
{
    public string? Description { get; set; }
    public decimal? Quantity { get; set; }
    public double? UnitPrice { get; set; }
    public double? Amount { get; set; }
}
