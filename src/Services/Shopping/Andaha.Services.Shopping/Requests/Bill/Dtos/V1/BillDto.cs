namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record BillDto(
    Guid Id,
    BillCategoryDto Category,
    BillSubCategoryDto? SubCategory,
    string ShopName,
    double Price,
    DateTime Date,
    string? Notes,
    bool IsExternal,
    bool ImageAvailable,
    IReadOnlyCollection<BillLineItemDto> LineItems);
