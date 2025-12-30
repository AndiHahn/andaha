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

    private static InvoiceAnalysisResult MapInvoice(AnalyzedDocument document)
    {
        var output = new InvoiceAnalysisResult();

        output.InvoiceId = document.Fields.GetString("InvoiceId");
        output.VendorName = document.Fields.GetString("VendorName");
        output.CustomerName = document.Fields.GetString("CustomerName");

        output.InvoiceDate = document.Fields.GetDate("InvoiceDate");

        var total = document.Fields.GetCurrency("InvoiceTotal");
        if (total != null)
        {
            output.TotalAmount = total.Amount;
            output.Currency = total.CurrencyCode;
        }

        if (document.Fields.TryGetValue("Items", out var itemsField) &&
            itemsField.FieldType == DocumentFieldType.List)
        {
            foreach (var item in itemsField.ValueList)
            {
                var itemFields = item.ValueDictionary;

                output.LineItems.Add(new InvoiceLineItem
                {
                    Description = itemFields.GetString("Description"),
                    Quantity = itemFields.GetDecimal("Quantity"),
                    UnitPrice = itemFields.GetCurrency("UnitPrice")?.Amount,
                    Amount = itemFields.GetCurrency("Amount")?.Amount
                });
            }
        }

        return output;
    }
}
