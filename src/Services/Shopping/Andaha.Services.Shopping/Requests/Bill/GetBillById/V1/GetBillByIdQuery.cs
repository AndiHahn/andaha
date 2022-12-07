using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.GetBillById.V1;

public record GetBillByIdQuery(Guid Id) : IHttpRequest;
