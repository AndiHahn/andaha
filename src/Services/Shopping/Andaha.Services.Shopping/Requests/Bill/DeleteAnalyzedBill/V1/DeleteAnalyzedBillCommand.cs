using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.DeleteAnalyzedBill.V1;

public record DeleteAnalyzedBillCommand(Guid Id) : IHttpRequest;
