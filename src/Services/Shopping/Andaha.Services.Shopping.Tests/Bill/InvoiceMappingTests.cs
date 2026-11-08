using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;
using Azure.AI.DocumentIntelligence;

namespace Andaha.Services.Shopping.Tests.Bill;

public class InvoiceMappingTests
{
    private static DocumentField Str(string v, float c) =>
        DocumentIntelligenceModelFactory.DocumentField(DocumentFieldType.String, valueString: v, content: v, confidence: c);

    private static DocumentField Cur(double amount, string content, float c) =>
        DocumentIntelligenceModelFactory.DocumentField(
            DocumentFieldType.Currency,
            valueCurrency: DocumentIntelligenceModelFactory.CurrencyValue(amount, "€", "EUR"),
            content: content, confidence: c);

    private static DocumentField Item(string desc, double amount, string content) =>
        DocumentIntelligenceModelFactory.DocumentField(
            DocumentFieldType.Dictionary,
            valueDictionary: DocumentIntelligenceModelFactory.DocumentFieldDictionary(
                new Dictionary<string, DocumentField>
                {
                    ["Description"] = Str(desc, 0.9f),
                    ["Amount"] = Cur(amount, content, 0.9f),
                }));

    [Fact]
    public void MapInvoice_carries_confidences_raw_total_and_signed_items()
    {
        var fields = new Dictionary<string, DocumentField>
        {
            ["VendorName"] = Str("Rewe", 0.83f),
            ["InvoiceDate"] = DocumentIntelligenceModelFactory.DocumentField(
                DocumentFieldType.Date, valueDate: new DateTimeOffset(2026, 11, 8, 0, 0, 0, TimeSpan.Zero),
                content: "08.11.2026", confidence: 0.91f),
            ["InvoiceTotal"] = Cur(7.25, "7,25", 0.77f),
            ["Items"] = DocumentIntelligenceModelFactory.DocumentField(
                DocumentFieldType.List,
                valueList: new[] { Item("A", 3.50, "3,50"), Item("B", 4.75, "4,75"), Item("Pfand", 1.00, "1,00-") }),
        };
        var doc = DocumentIntelligenceModelFactory.AnalyzedDocument(
            "invoice", null, null, DocumentIntelligenceModelFactory.DocumentFieldDictionary(fields), 0.88f);

        var result = InvoiceAnalysisService.MapInvoice(doc);

        Assert.Equal(0.83, result.VendorNameConfidence!.Value, 3);
        Assert.Equal(0.91, result.InvoiceDateConfidence!.Value, 3);
        Assert.Equal("7,25", result.TotalAmountText);
        Assert.Equal(new double?[] { 3.50, 4.75, -1.00 }, result.LineItems.Select(i => i.TotalPrice).ToArray());
    }

    [Fact]
    public void MapInvoice_rounds_float_confidences_so_inclusive_boundary_is_reachable()
    {
        var fields = new Dictionary<string, DocumentField>
        {
            ["VendorName"] = Str("Rewe", 0.75f),
            ["InvoiceDate"] = DocumentIntelligenceModelFactory.DocumentField(
                DocumentFieldType.Date, valueDate: new DateTimeOffset(2026, 1, 15, 0, 0, 0, TimeSpan.Zero),
                content: "15.01.2026", confidence: 0.8f),
            ["InvoiceTotal"] = Cur(7.25, "7,25", 0.9f),
        };
        var doc = DocumentIntelligenceModelFactory.AnalyzedDocument(
            "invoice", null, null, DocumentIntelligenceModelFactory.DocumentFieldDictionary(fields), 0.9f);

        var result = InvoiceAnalysisService.MapInvoice(doc);

        Assert.Equal(0.9, result.TotalAmountConfidence);
        Assert.Equal(0.9, result.Confidence);
        Assert.Equal(0.75, result.VendorNameConfidence);
        Assert.Equal(0.8, result.InvoiceDateConfidence);

        var reasons = AutoCreationRules.Evaluate(
            new AutoCreationInput(result.VendorName, result.VendorNameConfidence, new DateTime(2026, 1, 15),
                result.InvoiceDateConfidence, result.TotalAmount, result.TotalAmountConfidence,
                result.TotalAmountText, result.Confidence, 0.0, 0, true),
            new DateTime(2026, 1, 15));
        Assert.Empty(reasons);
    }
}
