using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;

namespace Andaha.Services.Shopping.Tests.Bill;

public class AutoCreationRulesTests
{
    private static readonly DateTime Today = new(2026, 1, 15);

    private static IReadOnlyList<NotCreatedReason> Eval(
        string? shop = "Billa", DateTime? date = null, double? amount = 10, double? confidence = 0.9,
        double? tac = 0.9, double sum = 10, bool category = true, bool noDate = false)
        => AutoCreationRules.Evaluate(shop, noDate ? null : date ?? Today, amount, confidence, tac, sum, category);

    [Fact]
    public void All_good_returns_empty() => Assert.Empty(Eval());

    [Fact]
    public void Shop_missing_yields_its_reason() => Assert.Equal([NotCreatedReason.ShopMissing], Eval(shop: " "));

    [Fact]
    public void Shop_null_yields_its_reason() => Assert.Equal([NotCreatedReason.ShopMissing], Eval(shop: null));

    [Fact]
    public void Date_missing_yields_its_reason() => Assert.Equal([NotCreatedReason.DateMissing], Eval(noDate: true));

    [Theory]
    [InlineData(null)]
    [InlineData(0.0)]
    public void Amount_missing_yields_its_reason(double? amount)
        => Assert.Equal([NotCreatedReason.AmountMissing], Eval(amount: amount, sum: 0, tac: 0.9));

    [Fact]
    public void Confidence_null_yields_low_confidence() => Assert.Equal([NotCreatedReason.LowConfidence], Eval(confidence: null));

    [Fact]
    public void Category_invalid_yields_category_unclear() => Assert.Equal([NotCreatedReason.CategoryUnclear], Eval(category: false));

    [Fact]
    public void Amount_uncertain_when_sum_off_and_tac_low()
    {
        Assert.Equal([NotCreatedReason.AmountUncertain], Eval(amount: 10, sum: 20, tac: 0.5));
        Assert.Empty(Eval(amount: 10, sum: 20, tac: 0.61));
    }

    [Fact]
    public void Boundaries()
    {
        Assert.Contains(NotCreatedReason.LowConfidence, Eval(confidence: 0.75));
        Assert.DoesNotContain(NotCreatedReason.AmountUncertain, Eval(amount: 10, sum: 15, tac: 0.6));
        Assert.Contains(NotCreatedReason.AmountUncertain, Eval(amount: 10, sum: 15.01, tac: 0.6));
    }

    [Fact]
    public void No_amount_uncertain_without_amount()
        => Assert.Equal([NotCreatedReason.AmountMissing], Eval(amount: null, sum: 20, tac: 0));

    [Fact]
    public void Order_follows_enum()
        => Assert.Equal(
            [NotCreatedReason.ShopMissing, NotCreatedReason.DateMissing, NotCreatedReason.AmountMissing,
             NotCreatedReason.LowConfidence, NotCreatedReason.CategoryUnclear],
            Eval(shop: null, noDate: true, amount: null, confidence: null, tac: 0, sum: 0, category: false));

    [Fact]
    public void NaN_values_yield_reasons()
    {
        var reasons = Eval(amount: double.NaN, confidence: double.NaN, tac: double.NaN, sum: 1);
        Assert.Contains(NotCreatedReason.AmountMissing, reasons);
        Assert.Contains(NotCreatedReason.LowConfidence, reasons);
    }

    [Fact]
    public void Legacy_failed_analysis_is_only_analysis_failed()
        => Assert.Equal([NotCreatedReason.AnalysisFailed], AutoCreationRules.DeriveForLegacy(null, null, null, null, 0, false));

    [Fact]
    public void Legacy_never_reports_date_missing()
    {
        Assert.Equal([NotCreatedReason.ShopMissing], AutoCreationRules.DeriveForLegacy("", 10, 0.9, 0.9, 10, true));
        Assert.Equal([NotCreatedReason.ShopMissing, NotCreatedReason.CategoryUnclear],
            AutoCreationRules.DeriveForLegacy("", 10, 0.9, 0.9, 10, false));
    }

    // Oracle: the original IsReasonableResult formula, copied verbatim (independent of the implementation).
    private static bool Oracle(string? shop, bool hasDate, double? amount, double? confidence, double? tac, double sum)
        => !string.IsNullOrWhiteSpace(shop) && hasDate && amount.HasValue && amount > 0 && confidence > 0.75
           && (amount.HasValue && Math.Abs(amount.Value - sum) <= 5.0 || tac > 0.6);

    [Theory]
    [InlineData("Billa", true, 10.0, 0.9, 0.9, 10.0)]
    [InlineData("Billa", true, 10.0, 0.9, 0.5, 20.0)]
    [InlineData("Billa", true, 10.0, 0.9, 0.7, 20.0)]
    [InlineData("Billa", true, 10.0, 0.75, 0.9, 10.0)]
    [InlineData("Billa", true, 10.0, 0.76, 0.9, 10.0)]
    [InlineData("Billa", true, 10.0, 0.9, 0.6, 15.0)]
    [InlineData("Billa", true, 10.0, 0.9, 0.6, 15.01)]
    [InlineData("Billa", true, 10.0, 0.9, null, 15.01)]
    [InlineData("Billa", true, 10.0, null, 0.9, 10.0)]
    [InlineData("", true, 10.0, 0.9, 0.9, 10.0)]
    [InlineData("Billa", false, 10.0, 0.9, 0.9, 10.0)]
    [InlineData("Billa", true, null, 0.9, 0.9, 0.0)]
    [InlineData("Billa", true, 0.0, 0.9, 0.9, 0.0)]
    [InlineData("Billa", true, -5.0, 0.9, 0.9, -5.0)]
    public void Evaluate_matches_IsReasonableResult(string? shop, bool hasDate, double? amount, double? confidence, double? tac, double sum)
    {
        var expected = Oracle(shop, hasDate, amount, confidence, tac, sum);
        var date = hasDate ? Today : (DateTime?)null;

        Assert.Equal(expected, AutoCreationRules.Evaluate(shop, date, amount, confidence, tac, sum, categoryValid: true).Count == 0);

        // Delegation wiring: the model's IsReasonableResult agrees.
        var result = new InvoiceAnalysisResult
        {
            VendorName = shop,
            InvoiceDate = hasDate ? new DateTimeOffset(Today) : null,
            TotalAmount = amount,
            Confidence = confidence,
            TotalAmountConfidence = tac,
            LineItems = [new InvoiceLineItem { TotalPrice = sum }],
        };
        Assert.Equal(expected, result.IsReasonableResult());
    }
}
