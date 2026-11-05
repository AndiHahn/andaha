using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Shopping.Requests.Bill.LineItems;

namespace Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;

public record CreateBillCommand(
    Guid? Id,
    Guid CategoryId,
    Guid? SubCategoryId,
    string ShopName,
    double Price,
    DateTime Date,
    string? Notes,
    IFormFile? Image,
    IReadOnlyList<LineItemData>? LineItems = null) : IHttpRequest;
