namespace Andaha.Services.Shopping.Core;

/// <summary>
/// Why an analysed bill was not created automatically. Order is the display order.
/// The member names are persisted (JSON column on AnalyzedBill) and returned by the API:
/// only append new members, never rename or remove existing ones.
/// </summary>
public enum NotCreatedReason
{
    AnalysisFailed,
    ShopMissing,
    DateMissing,
    AmountMissing,
    LowConfidence,
    AmountUncertain,
    CategoryUnclear,
}
