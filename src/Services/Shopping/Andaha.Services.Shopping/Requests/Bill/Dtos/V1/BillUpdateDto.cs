namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record BillUpdateDto(Guid CategoryId, string ShopName, double Price, DateTime Date, string? Notes, IFormFile? Image);
