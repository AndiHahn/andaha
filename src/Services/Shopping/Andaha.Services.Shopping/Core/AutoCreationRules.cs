using System.Text.RegularExpressions;

namespace Andaha.Services.Shopping.Core;

/// <summary>Everything the auto-creation rules look at. A missing confidence counts as uncertain.</summary>
public sealed record AutoCreationInput(
    string? ShopName,
    double? ShopConfidence,
    DateTime? Date,
    double? DateConfidence,
    double? TotalAmount,
    double? TotalAmountConfidence,
    string? TotalAmountText,
    double? DocumentConfidence,
    double LineItemsSum,
    int LineItemsWithPrice,
    bool CategoryValid);

/// <summary>Single source of the rules deciding whether an analysed bill is created automatically.</summary>
public static partial class AutoCreationRules
{
    public const double MinShopConfidence = 0.75;
    public const double MinDateConfidence = 0.80;
    /// <summary>The document confidence must be strictly greater.</summary>
    public const double MinDocumentConfidence = 0.75;
    public const double SureTotalAmountConfidence = 0.90;
    public const double MinTotalAmountConfidence = 0.60;
    /// <summary>Inclusive.</summary>
    public const double LineItemSumTolerance = 0.10;
    public const int MaxDaysInFuture = 1;

    // Tolerance for floating point noise when comparing sums (e.g. 7.35 - 7.25 is 0.0999999999999996).
    private const double Epsilon = 1e-9;

    // A number with exactly two decimals somewhere in the raw text.
    [GeneratedRegex(@"\d[.,]\d{2}(?!\d)")]
    private static partial Regex TwoDecimals();

    /// <summary>
    /// Returns the reasons (in enum order, never AnalysisFailed); empty means the bill may be created.
    /// <paramref name="referenceUtcDate"/> is today's UTC date (injected for purity and testability).
    /// </summary>
    public static IReadOnlyList<NotCreatedReason> Evaluate(AutoCreationInput input, DateTime referenceUtcDate)
        => EvaluateCore(input, referenceUtcDate, legacy: false);

    /// <summary>
    /// Derives reasons for already stored analyses that have no persisted reasons. The field confidences,
    /// the date and the raw amount text are not stored for them, so those four rules are skipped.
    /// </summary>
    public static IReadOnlyList<NotCreatedReason> DeriveForLegacy(
        string? shopName, double? price, double? confidence,
        double? totalAmountConfidence, double lineItemsSum, int lineItemsWithPrice, bool hasCategory)
    {
        if (confidence == null && string.IsNullOrWhiteSpace(shopName) && price == null)
            return [NotCreatedReason.AnalysisFailed];

        var input = new AutoCreationInput(
            shopName, null, DateTime.MinValue, null, price, totalAmountConfidence, null,
            confidence, lineItemsSum, lineItemsWithPrice, hasCategory);

        return EvaluateCore(input, DateTime.MinValue, legacy: true);
    }

    private static List<NotCreatedReason> EvaluateCore(AutoCreationInput input, DateTime referenceUtcDate, bool legacy)
    {
        var reasons = new List<NotCreatedReason>();

        if (string.IsNullOrWhiteSpace(input.ShopName))
            reasons.Add(NotCreatedReason.ShopMissing);
        if (!legacy && !(input.ShopConfidence >= MinShopConfidence))
            reasons.Add(NotCreatedReason.ShopUncertain);

        if (!input.Date.HasValue)
            reasons.Add(NotCreatedReason.DateMissing);
        if (!legacy && !(input.DateConfidence >= MinDateConfidence))
            reasons.Add(NotCreatedReason.DateUncertain);
        if (!legacy && input.Date.HasValue && input.Date.Value.Date > referenceUtcDate.Date.AddDays(MaxDaysInFuture))
            reasons.Add(NotCreatedReason.DateInFuture);

        var hasAmount = input.TotalAmount > 0;
        if (!hasAmount)
            reasons.Add(NotCreatedReason.AmountMissing);
        if (!legacy && hasAmount
            && (string.IsNullOrWhiteSpace(input.TotalAmountText) || !TwoDecimals().IsMatch(input.TotalAmountText)))
            reasons.Add(NotCreatedReason.AmountIncomplete);
        if (hasAmount && !IsAmountReliable(input))
            reasons.Add(NotCreatedReason.AmountUncertain);

        if (!(input.DocumentConfidence > MinDocumentConfidence))
            reasons.Add(NotCreatedReason.LowConfidence);
        if (!input.CategoryValid)
            reasons.Add(NotCreatedReason.CategoryUnclear);

        return reasons;
    }

    private static bool IsAmountReliable(AutoCreationInput input)
    {
        if (input.TotalAmountConfidence >= SureTotalAmountConfidence)
            return true;

        return input.TotalAmountConfidence >= MinTotalAmountConfidence
            && input.LineItemsWithPrice >= 1
            && Math.Abs(input.TotalAmount!.Value - input.LineItemsSum) <= LineItemSumTolerance + Epsilon;
    }
}
