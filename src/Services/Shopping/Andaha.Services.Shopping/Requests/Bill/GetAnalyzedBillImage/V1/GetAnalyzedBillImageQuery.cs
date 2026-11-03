using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.GetAnalyzedBillImage.V1;

public record GetAnalyzedBillImageQuery(Guid Id) : IHttpRequest;
