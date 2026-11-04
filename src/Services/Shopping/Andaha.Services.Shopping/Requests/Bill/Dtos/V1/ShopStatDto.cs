namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public readonly record struct ShopStatDto(
    string ShopName,
    Guid CategoryId,
    Guid? SubCategoryId,
    int Count,
    DateTime LastUsed);
