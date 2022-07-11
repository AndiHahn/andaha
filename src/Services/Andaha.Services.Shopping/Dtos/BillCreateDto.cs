namespace Andaha.Services.Shopping.Dtos;

public readonly record struct BillCreateDto(Guid CategoryId, string ShopName, double Price, string? Notes);
