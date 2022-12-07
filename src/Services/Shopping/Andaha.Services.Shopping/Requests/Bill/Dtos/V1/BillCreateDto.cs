namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record BillCreateDto(Guid? Id, Guid CategoryId, string ShopName, double Price, DateTime Date, string? Notes, IFormFile? Image);
