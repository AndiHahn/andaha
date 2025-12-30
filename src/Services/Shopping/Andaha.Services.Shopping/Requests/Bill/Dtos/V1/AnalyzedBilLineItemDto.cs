namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record AnalyzedBillLineItemDto(
    string? Description,
    double? TotalPrice,
    int? Quantity,
    double? UnitPrice);
