namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record BillCreateDto(
    Guid? Id,
    Guid CategoryId,
    Guid? SubCategoryId,
    string ShopName,
    double Price,
    DateTime Date,
    string? Notes,
    IFormFile? Image);
