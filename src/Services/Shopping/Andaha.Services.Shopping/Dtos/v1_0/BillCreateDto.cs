namespace Andaha.Services.Shopping.Dtos.v1_0;

public readonly record struct BillCreateDto(Guid CategoryId, string ShopName, double Price, DateTime? Date, string? Notes);
