namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record BillLineItemDto(
    string? Description,
    double? TotalPrice,
    int? Quantity,
    double? UnitPrice);
