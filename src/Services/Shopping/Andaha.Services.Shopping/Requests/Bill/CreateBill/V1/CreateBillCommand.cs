using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;

public record CreateBillCommand(
    Guid? Id,
    Guid CategoryId,
    Guid? SubCategoryId,
    string ShopName,
    double Price,
    DateTime Date,
    string? Notes,
    IFormFile? Image) : IHttpRequest;
