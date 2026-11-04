using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.BillTemplate.DeleteBillTemplate.V1;

public record DeleteBillTemplateCommand(Guid Id) : IHttpRequest;
