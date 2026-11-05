namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record BillLineItemDto(
    Guid Id,
    string Description,
    int? Quantity,
    double? UnitPrice,
    double? TotalPrice);
