using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.UpdateBill.V1;

public record UpdateBillCommand(
    Guid Id,
    Guid CategoryId,
    string ShopName,
    double Price,
    DateTime Date,
    string? Notes,
    IFormFile? Image) : IHttpRequest;
