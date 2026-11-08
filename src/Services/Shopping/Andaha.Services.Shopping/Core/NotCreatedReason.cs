namespace Andaha.Services.Shopping.Core;

/// <summary>
/// Why an analysed bill was not created automatically. Order is the display order.
/// The member names are persisted (JSON column on AnalyzedBill) and returned by the API:
/// reordering is allowed, renaming or removing existing members is not.
/// </summary>
public enum NotCreatedReason
{
    AnalysisFailed,
    ShopMissing,
    ShopUncertain,
    DateMissing,
    DateUncertain,
    DateInFuture,
    AmountMissing,
    AmountIncomplete,
    AmountUncertain,
    LowConfidence,
    CategoryUnclear,
}
