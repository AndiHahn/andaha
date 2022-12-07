using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.GetBillImage.V1;

public record GetBillImageQuery(Guid Id) : IHttpRequest;
