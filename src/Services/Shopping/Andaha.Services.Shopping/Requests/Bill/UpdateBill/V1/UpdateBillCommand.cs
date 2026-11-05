using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Shopping.Requests.Bill.LineItems;

namespace Andaha.Services.Shopping.Requests.Bill.UpdateBill.V1;

public record UpdateBillCommand(
    Guid Id,
    Guid CategoryId,
    Guid? SubCategoryId,
    string ShopName,
    double Price,
    DateTime Date,
    string? Notes,
    IFormFile? Image,
    IReadOnlyList<LineItemData>? LineItems = null) : IHttpRequest;
