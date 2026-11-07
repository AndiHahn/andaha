namespace Andaha.Services.Shopping.Core;

/// <summary>Single source of the rules deciding whether an analysed bill is created automatically.</summary>
public static class AutoCreationRules
{
    public const double MinConfidence = 0.75;
    public const double MinTotalAmountConfidence = 0.6;
    public const double MaxSumTolerance = 5.0;

    /// <summary>Returns the reasons (in enum order, never AnalysisFailed); empty means the bill may be created.</summary>
    public static IReadOnlyList<NotCreatedReason> Evaluate(
        string? shopName, DateTime? date, double? totalAmount, double? confidence,
        double? totalAmountConfidence, double lineItemsSum, bool categoryValid)
    {
        var reasons = new List<NotCreatedReason>();

        if (string.IsNullOrWhiteSpace(shopName))
            reasons.Add(NotCreatedReason.ShopMissing);
        if (!date.HasValue)
            reasons.Add(NotCreatedReason.DateMissing);
        if (!(totalAmount > 0))
            reasons.Add(NotCreatedReason.AmountMissing);
        if (!(confidence > MinConfidence))
            reasons.Add(NotCreatedReason.LowConfidence);
        if (totalAmount > 0
            && !(Math.Abs(totalAmount.Value - lineItemsSum) <= MaxSumTolerance)
            && !(totalAmountConfidence > MinTotalAmountConfidence))
            reasons.Add(NotCreatedReason.AmountUncertain);
        if (!categoryValid)
            reasons.Add(NotCreatedReason.CategoryUnclear);

        return reasons;
    }

    /// <summary>Derives reasons for already stored analyses that have no persisted reasons (no date is stored).</summary>
    public static IReadOnlyList<NotCreatedReason> DeriveForLegacy(
        string? shopName, double? price, double? confidence,
        double? totalAmountConfidence, double lineItemsSum, bool hasCategory)
    {
        if (confidence == null && string.IsNullOrWhiteSpace(shopName) && price == null)
            return [NotCreatedReason.AnalysisFailed];

        return Evaluate(shopName, DateTime.MinValue, price, confidence, totalAmountConfidence, lineItemsSum, hasCategory);
    }
}
