using System.Text.RegularExpressions;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;

namespace Andaha.Services.Shopping.Tests.Bill;

public class AutoCreationRulesTests
{
    private static readonly DateTime Reference = new(2026, 1, 15);
    private static readonly DateTime Today = Reference;

    private static IReadOnlyList<NotCreatedReason> Eval(
        string? shop = "Billa", double? shopConf = 0.9, DateTime? date = null, double? dateConf = 0.9,
        double? amount = 10, double? tac = 0.95, string? text = "10,00", double? confidence = 0.9,
        double sum = 10, int withPrice = 1, bool category = true, bool noDate = false)
        => AutoCreationRules.Evaluate(
            new AutoCreationInput(shop, shopConf, noDate ? null : date ?? Today, dateConf, amount, tac, text,
                confidence, sum, withPrice, category),
            Reference);

    [Fact]
    public void All_good_returns_empty() => Assert.Empty(Eval(amount: 7.25, text: "7,25", sum: 7.25));

    [Fact]
    public void Shop_missing_yields_its_reason() => Assert.Equal([NotCreatedReason.ShopMissing], Eval(shop: " "));

    [Fact]
    public void Shop_null_yields_its_reason() => Assert.Equal([NotCreatedReason.ShopMissing], Eval(shop: null));

    [Fact]
    public void Date_missing_yields_its_reason() => Assert.Equal([NotCreatedReason.DateMissing], Eval(noDate: true));

    [Theory]
    [InlineData(0.74, true)]
    [InlineData(null, true)]
    [InlineData(double.NaN, true)]
    [InlineData(0.75, false)]
    public void Shop_confidence_boundary(double? conf, bool uncertain)
        => Assert.Equal(uncertain ? [NotCreatedReason.ShopUncertain] : [], Eval(shopConf: conf));

    [Theory]
    [InlineData(0.79, true)]
    [InlineData(null, true)]
    [InlineData(0.80, false)]
    public void Date_confidence_boundary(double? conf, bool uncertain)
        => Assert.Equal(uncertain ? [NotCreatedReason.DateUncertain] : [], Eval(dateConf: conf));

    [Fact]
    public void Date_in_future_boundary()
    {
        Assert.Equal([NotCreatedReason.DateInFuture], Eval(date: Reference.AddDays(2)));
        Assert.Empty(Eval(date: Reference.AddDays(1)));
        Assert.Empty(Eval(date: Reference.AddDays(1).AddHours(23)));
    }

    [Theory]
    [InlineData("7,", true)]
    [InlineData("7", true)]
    [InlineData("7,2", true)]
    [InlineData("7,250", true)]
    [InlineData(null, true)]
    [InlineData("", true)]
    [InlineData("7,25", false)]
    [InlineData("7.25", false)]
    [InlineData("EUR 7,25", false)]
    [InlineData("7,25 €", false)]
    public void Amount_text_must_show_two_decimals(string? text, bool incomplete)
        => Assert.Equal(incomplete ? [NotCreatedReason.AmountIncomplete] : [], Eval(text: text));

    [Fact]
    public void Amount_sure_confidence_needs_no_line_items()
        => Assert.Empty(Eval(tac: 0.90, sum: 0, withPrice: 0));

    [Fact]
    public void Amount_middle_confidence_accepts_sum_within_tolerance()
    {
        Assert.Empty(Eval(amount: 10, tac: 0.89, sum: 9.90));
        Assert.Empty(Eval(amount: 10, tac: 0.89, sum: 10.10));
        Assert.Empty(Eval(amount: 7.35, text: "7,35", tac: 0.89, sum: 7.25));
        Assert.Equal([NotCreatedReason.AmountUncertain], Eval(amount: 10, tac: 0.89, sum: 9.89));
        Assert.Equal([NotCreatedReason.AmountUncertain], Eval(amount: 10, tac: 0.89, sum: 10.11));
    }

    [Fact]
    public void Amount_middle_confidence_without_line_items_is_uncertain()
        => Assert.Equal([NotCreatedReason.AmountUncertain], Eval(tac: 0.89, sum: 0, withPrice: 0, amount: 10));

    [Fact]
    public void Amount_lower_bound_is_inclusive_with_matching_sum()
        => Assert.Empty(Eval(tac: 0.60, sum: 10));

    [Theory]
    [InlineData(0.59)]
    [InlineData(null)]
    [InlineData(double.NaN)]
    public void Amount_below_lower_bound_is_always_uncertain(double? tac)
        => Assert.Equal([NotCreatedReason.AmountUncertain], Eval(tac: tac, sum: 10));

    [Theory]
    [InlineData(null)]
    [InlineData(0.0)]
    public void Amount_missing_yields_its_reason(double? amount)
        => Assert.Equal([NotCreatedReason.AmountMissing], Eval(amount: amount, sum: 0, tac: 0.9));

    [Fact]
    public void Confidence_null_yields_low_confidence() => Assert.Equal([NotCreatedReason.LowConfidence], Eval(confidence: null));

    [Fact]
    public void Document_confidence_must_be_strictly_greater()
    {
        Assert.Contains(NotCreatedReason.LowConfidence, Eval(confidence: 0.75));
        Assert.DoesNotContain(NotCreatedReason.LowConfidence, Eval(confidence: 0.76));
    }

    [Fact]
    public void Category_invalid_yields_category_unclear() => Assert.Equal([NotCreatedReason.CategoryUnclear], Eval(category: false));

    [Fact]
    public void No_amount_rules_without_amount()
        => Assert.Equal([NotCreatedReason.AmountMissing], Eval(amount: null, text: null, sum: 20, tac: 0));

    [Theory]
    [InlineData(0.0)]
    [InlineData(-5.0)]
    [InlineData(double.NaN)]
    public void No_amount_rules_unless_amount_positive(double amount)
        => Assert.Equal([NotCreatedReason.AmountMissing], Eval(amount: amount, text: "7,", sum: 20, tac: 0.1));

    [Fact]
    public void Trigger_case_incomplete_amount_text_is_not_created()
    {
        // 7,00 read from "7," (cents covered), sum of items 7,25, high amount confidence.
        var reasons = Eval(amount: 7.00, text: "7,", tac: 0.95, sum: 7.25);
        Assert.Contains(NotCreatedReason.AmountIncomplete, reasons);
    }

    [Fact]
    public void Discount_line_case_is_created()
    {
        // Items 3,50 + 4,75 + (-1,00) = 7,25 (sign-corrected by the analysis), total 7,25, middle confidence.
        double sum = 3.50 + 4.75 + -1.00;
        Assert.Empty(Eval(amount: 7.25, text: "7,25", tac: 0.7, sum: sum, withPrice: 3));
    }

    [Fact]
    public void Order_follows_enum_and_incomplete_may_join_uncertain()
    {
        var reasons = Eval(shop: null, shopConf: null, noDate: true, dateConf: null, amount: 7.0, text: "7,",
            tac: 0.1, confidence: null, sum: 0, withPrice: 0, category: false);

        Assert.Equal(
            [NotCreatedReason.ShopMissing, NotCreatedReason.ShopUncertain, NotCreatedReason.DateMissing,
             NotCreatedReason.DateUncertain, NotCreatedReason.AmountIncomplete, NotCreatedReason.AmountUncertain,
             NotCreatedReason.LowConfidence, NotCreatedReason.CategoryUnclear],
            reasons);

        var future = Eval(date: Reference.AddDays(5), dateConf: 0.1);
        Assert.Equal([NotCreatedReason.DateUncertain, NotCreatedReason.DateInFuture], future);

        Assert.Equal(
            [NotCreatedReason.AnalysisFailed, NotCreatedReason.ShopMissing, NotCreatedReason.ShopUncertain,
             NotCreatedReason.DateMissing, NotCreatedReason.DateUncertain, NotCreatedReason.DateInFuture,
             NotCreatedReason.AmountMissing, NotCreatedReason.AmountIncomplete, NotCreatedReason.AmountUncertain,
             NotCreatedReason.LowConfidence, NotCreatedReason.CategoryUnclear],
            Enum.GetValues<NotCreatedReason>());
    }

    [Fact]
    public void NaN_values_yield_reasons()
    {
        var reasons = Eval(amount: double.NaN, confidence: double.NaN, tac: double.NaN, sum: 1);
        Assert.Contains(NotCreatedReason.AmountMissing, reasons);
        Assert.Contains(NotCreatedReason.LowConfidence, reasons);
    }

    [Fact]
    public void Legacy_failed_analysis_is_only_analysis_failed()
        => Assert.Equal([NotCreatedReason.AnalysisFailed], AutoCreationRules.DeriveForLegacy(null, null, null, null, 0, 0, false));

    [Fact]
    public void Legacy_never_reports_date_missing()
    {
        Assert.Equal([NotCreatedReason.ShopMissing], AutoCreationRules.DeriveForLegacy("", 10, 0.9, 0.9, 10, 1, true));
        Assert.Equal([NotCreatedReason.ShopMissing, NotCreatedReason.CategoryUnclear],
            AutoCreationRules.DeriveForLegacy("", 10, 0.9, 0.9, 10, 1, false));
    }

    [Fact]
    public void Legacy_low_confidence_without_line_items_is_amount_uncertain_and_low_confidence()
        => Assert.Equal(
            [NotCreatedReason.AmountUncertain, NotCreatedReason.LowConfidence],
            AutoCreationRules.DeriveForLegacy("Billa", 10, 0.5, 0.5, 0, 0, true));

    [Fact]
    public void Legacy_never_reports_the_four_new_codes()
    {
        var reasons = AutoCreationRules.DeriveForLegacy("Billa", 10, 0.1, 0.1, 0, 0, false);
        Assert.DoesNotContain(NotCreatedReason.ShopUncertain, reasons);
        Assert.DoesNotContain(NotCreatedReason.DateUncertain, reasons);
        Assert.DoesNotContain(NotCreatedReason.DateInFuture, reasons);
        Assert.DoesNotContain(NotCreatedReason.AmountIncomplete, reasons);
    }

    [Fact]
    public void Legacy_amount_uses_tolerance_and_item_count()
    {
        Assert.Empty(AutoCreationRules.DeriveForLegacy("Billa", 10, 0.9, 0.7, 9.95, 1, true));
        Assert.Equal([NotCreatedReason.AmountUncertain], AutoCreationRules.DeriveForLegacy("Billa", 10, 0.9, 0.7, 8, 1, true));
        Assert.Equal([NotCreatedReason.AmountUncertain], AutoCreationRules.DeriveForLegacy("Billa", 10, 0.9, 0.7, 10, 0, true));
    }

    // Oracle: the formula of design.md section 2, written out independently of the implementation.
    private static bool Oracle(string? shop, double? shopConf, bool hasDate, double? dateConf, int futureDays,
        double? amount, string? text, double? tac, double? confidence, double sum, int withPrice)
    {
        bool shopOk = !string.IsNullOrWhiteSpace(shop) && shopConf >= 0.75;
        bool dateOk = hasDate && dateConf >= 0.80 && futureDays <= 1;
        bool amountOk = amount > 0;
        bool textOk = text is not null && Regex.IsMatch(text, @"\d[.,]\d{2}(?!\d)");
        bool confOk = tac >= 0.90
            || (tac >= 0.60 && withPrice >= 1 && Math.Round(Math.Abs((amount ?? 0) - sum), 6) <= 0.10);

        return shopOk && dateOk && amountOk && textOk && confOk && confidence > 0.75;
    }

    [Theory]
    [InlineData("Billa", 0.9, true, 0.9, 0, 10.0, "10,00", 0.95, 0.9, 10.0, 1)]
    [InlineData("Billa", 0.74, true, 0.9, 0, 10.0, "10,00", 0.95, 0.9, 10.0, 1)]
    [InlineData("Billa", 0.75, true, 0.8, 1, 10.0, "10,00", 0.95, 0.9, 10.0, 1)]
    [InlineData("Billa", 0.9, true, 0.79, 0, 10.0, "10,00", 0.95, 0.9, 10.0, 1)]
    [InlineData("Billa", 0.9, true, 0.9, 2, 10.0, "10,00", 0.95, 0.9, 10.0, 1)]
    [InlineData("Billa", 0.9, true, 0.9, 0, 7.0, "7,", 0.95, 0.9, 7.25, 3)]
    [InlineData("Billa", 0.9, true, 0.9, 0, 10.0, "10,00", 0.89, 0.9, 9.9, 1)]
    [InlineData("Billa", 0.9, true, 0.9, 0, 10.0, "10,00", 0.89, 0.9, 9.89, 1)]
    [InlineData("Billa", 0.9, true, 0.9, 0, 10.0, "10,00", 0.89, 0.9, 0.0, 0)]
    [InlineData("Billa", 0.9, true, 0.9, 0, 10.0, "10,00", 0.60, 0.9, 10.0, 1)]
    [InlineData("Billa", 0.9, true, 0.9, 0, 10.0, "10,00", 0.59, 0.9, 10.0, 1)]
    [InlineData("Billa", 0.9, true, 0.9, 0, 10.0, "10,00", null, 0.9, 10.0, 1)]
    [InlineData("Billa", 0.9, true, 0.9, 0, 10.0, "10,00", 0.95, 0.75, 10.0, 1)]
    [InlineData("Billa", 0.9, false, 0.9, 0, 10.0, "10,00", 0.95, 0.9, 10.0, 1)]
    [InlineData("", 0.9, true, 0.9, 0, 10.0, "10,00", 0.95, 0.9, 10.0, 1)]
    [InlineData("Billa", 0.9, true, 0.9, 0, 0.0, "0,00", 0.95, 0.9, 0.0, 0)]
    public void Evaluate_matches_the_design_formula(
        string? shop, double? shopConf, bool hasDate, double? dateConf, int futureDays,
        double? amount, string? text, double? tac, double? confidence, double sum, int withPrice)
    {
        var expected = Oracle(shop, shopConf, hasDate, dateConf, futureDays, amount, text, tac, confidence, sum, withPrice);
        var date = hasDate ? Reference.AddDays(futureDays) : (DateTime?)null;

        Assert.Equal(expected,
            AutoCreationRules.Evaluate(
                new AutoCreationInput(shop, shopConf, date, dateConf, amount, tac, text, confidence, sum, withPrice, true),
                Reference).Count == 0);

        // Delegation wiring: the model's IsReasonableResult agrees (its reference date is today).
        var result = new InvoiceAnalysisResult
        {
            VendorName = shop,
            VendorNameConfidence = shopConf,
            InvoiceDate = hasDate ? new DateTimeOffset(DateTime.UtcNow.Date.AddDays(futureDays)) : null,
            InvoiceDateConfidence = dateConf,
            TotalAmount = amount,
            TotalAmountText = text,
            Confidence = confidence,
            TotalAmountConfidence = tac,
            LineItems = withPrice > 0 ? [new InvoiceLineItem { TotalPrice = sum }] : [],
        };
        Assert.Equal(expected, result.IsReasonableResult());
    }
}
