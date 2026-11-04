namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V1;

public record AnalyzeBillResultDto(
    string? ShopName,
    DateTime? Date,
    double? TotalAmount,
    Guid? CategoryId,
    Guid? SubCategoryId,
    double? Confidence,
    IReadOnlyList<AnalyzeBillLineItemDto> LineItems);

public record AnalyzeBillLineItemDto(
    string? Description,
    double? Quantity,
    double? UnitPrice,
    double? TotalPrice);
