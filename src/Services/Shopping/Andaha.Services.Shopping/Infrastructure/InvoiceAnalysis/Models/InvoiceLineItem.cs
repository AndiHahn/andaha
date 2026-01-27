namespace Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;

public class InvoiceLineItem
{
    public string? Description { get; set; }
    public int? Quantity { get; set; }
    public double? UnitPrice { get; set; }
    public double? TotalPrice { get; set; }
}
