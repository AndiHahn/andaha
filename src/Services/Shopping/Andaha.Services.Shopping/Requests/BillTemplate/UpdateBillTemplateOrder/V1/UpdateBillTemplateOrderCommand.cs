using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplateOrder.V1;

public record UpdateBillTemplateOrderCommand(Guid[] Ids) : IHttpRequest;
