namespace Andaha.Services.Shopping.Dtos;

public readonly record struct BillDto(Guid Id, Guid CreatedByUserId, Guid CategoryId, string ShopName, double Price, DateTime Date, string Notes);
