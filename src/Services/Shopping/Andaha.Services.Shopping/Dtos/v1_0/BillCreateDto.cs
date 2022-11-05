namespace Andaha.Services.Shopping.Dtos.v1_0;

public record BillCreateDto(Guid? Id, Guid CategoryId, string ShopName, double Price, DateTime Date, string? Notes, IFormFile? Image);
