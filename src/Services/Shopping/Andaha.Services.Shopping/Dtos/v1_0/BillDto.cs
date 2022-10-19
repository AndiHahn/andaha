namespace Andaha.Services.Shopping.Dtos.v1_0;

public readonly record struct BillDto(
    Guid Id,
    Guid CreatedByUserId,
    BillCategoryDto Category,
    string ShopName,
    double Price,
    DateTime Date, 
    string? Notes,
    bool IsExternal);
