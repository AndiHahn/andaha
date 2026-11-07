namespace Andaha.Services.Shopping.Core;

/// <summary>Why an analysed bill was not created automatically. Order is the display order.</summary>
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
