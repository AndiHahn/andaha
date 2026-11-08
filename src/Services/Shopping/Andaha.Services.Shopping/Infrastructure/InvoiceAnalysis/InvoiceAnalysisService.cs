using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;
using Azure;
using Azure.AI.DocumentIntelligence;
using Microsoft.Extensions.Options;

namespace Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;

public class InvoiceAnalysisService : IInvoiceAnalysisService
{
    private readonly DocumentIntelligenceClient client;

    public InvoiceAnalysisService(IOptions<DocumentIntelligenceOptions> options)
    {
        client = new DocumentIntelligenceClient(
            new Uri(options.Value.Endpoint),
            new AzureKeyCredential(options.Value.ApiKey));
    }

    public async Task<InvoiceAnalysisResult> AnalyzeAsync(
        Stream invoiceStream,
        CancellationToken ct = default)
    {
        BinaryData binaryData = await BinaryData.FromStreamAsync(invoiceStream, ct);
       
        var operation = await client.AnalyzeDocumentAsync(
            WaitUntil.Completed,
            "prebuilt-invoice",
            binaryData,
            ct);

        AnalyzeResult result = operation.Value;

        var document = result.Documents.FirstOrDefault();
        if (document is null)
        {
            throw new InvalidOperationException("No invoice document detected.");
        }

        return MapInvoice(document);
    }

    /// <summary>Azure confidences are float; (double)0.9f is 0.8999999..., so round to make inclusive thresholds reachable.</summary>
    private static double? ToDouble(float? c) =>
        c is float f ? Math.Round((double)f, 3, MidpointRounding.AwayFromZero) : null;

    internal static InvoiceAnalysisResult MapInvoice(AnalyzedDocument document)
    {
        var output = new InvoiceAnalysisResult();

        output.Confidence = ToDouble(document.Confidence);
        output.InvoiceId = document.Fields.GetString("InvoiceId");
        output.VendorName = document.Fields.GetString("VendorName");
        output.CustomerName = document.Fields.GetString("CustomerName");

        output.InvoiceDate = document.Fields.GetDate("InvoiceDate");

        if (document.Fields.TryGetValue("VendorName", out var vendorField))
        {
            output.VendorNameConfidence = ToDouble(vendorField.Confidence);
        }

        if (document.Fields.TryGetValue("InvoiceDate", out var dateField))
        {
            output.InvoiceDateConfidence = ToDouble(dateField.Confidence);
        }

        var total = document.Fields.GetCurrency("InvoiceTotal");
        if (total != null)
        {
            output.TotalAmount = total.Amount;
            output.Currency = total.CurrencyCode;
        }

        // Read raw field to get confidence score (0..1)
        if (document.Fields.TryGetValue("InvoiceTotal", out var totalField))
        {
            output.TotalAmountConfidence = ToDouble(totalField.Confidence);
            output.TotalAmountText = totalField.Content;
        }

        if (document.Fields.TryGetValue("Items", out var itemsField) &&
            itemsField.FieldType == DocumentFieldType.List)
        {
            foreach (var item in itemsField.ValueList)
            {
                var itemFields = item.ValueDictionary;

                string? amountContent = itemFields.TryGetValue("Amount", out var amountField)
                    ? amountField.Content
                    : null;
                var (totalPrice, unitPrice) = AmountSign.Apply(
                    itemFields.GetCurrency("Amount")?.Amount,
                    itemFields.GetCurrency("UnitPrice")?.Amount,
                    amountContent);

                output.LineItems.Add(new InvoiceLineItem
                {
                    Description = itemFields.GetString("Description"),
                    Quantity = (int?)itemFields.GetDecimal("Quantity"),
                    UnitPrice = unitPrice,
                    TotalPrice = totalPrice
                });
            }
        }

        return output;
    }
}
