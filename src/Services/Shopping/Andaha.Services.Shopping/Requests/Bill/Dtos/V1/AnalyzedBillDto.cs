namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record AnalyzedBillDto(
    Guid Id,
    Guid? CategoryId,
    Guid? SubCategoryId,
    string? ShopName,
    double? Price,
    DateTime? Date,
    IReadOnlyCollection<AnalyzedBillLineItemDto> LineItems,
    double? Confidence,
    double? TotalAmountConfidence,
    bool ImageAvailable,
    string? SourceUploadId);