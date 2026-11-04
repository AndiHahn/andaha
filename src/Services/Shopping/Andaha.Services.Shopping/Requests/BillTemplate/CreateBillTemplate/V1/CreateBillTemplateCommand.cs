using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.BillTemplate.CreateBillTemplate.V1;

public record CreateBillTemplateCommand(
    string? Name,
    string? ShopName,
    Guid CategoryId,
    Guid? SubCategoryId) : IHttpRequest;
