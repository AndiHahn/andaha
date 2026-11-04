using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplate.V1;

public record UpdateBillTemplateCommand(
    Guid Id,
    string? Name,
    string? ShopName,
    Guid CategoryId,
    Guid? SubCategoryId) : IHttpRequest;
