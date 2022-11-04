namespace Andaha.Services.Shopping.Dtos.v1_0;

public record BillDto(
    Guid Id,
    BillCategoryDto Category,
    string ShopName,
    double Price,
    DateTime Date, 
    string? Notes,
    bool IsExternal,
    bool ImageAvailable);
