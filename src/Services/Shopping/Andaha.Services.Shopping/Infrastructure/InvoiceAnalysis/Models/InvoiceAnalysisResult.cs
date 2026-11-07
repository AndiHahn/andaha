using Andaha.Services.Shopping.Core;

﻿namespace Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;

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
        double lineItemsSum = LineItems?.Sum(lineItem => lineItem.TotalPrice) ?? 0.0;

        return AutoCreationRules.Evaluate(
            VendorName, InvoiceDate?.DateTime, TotalAmount, Confidence, TotalAmountConfidence,
            lineItemsSum, categoryValid: true).Count == 0;
    }
}
