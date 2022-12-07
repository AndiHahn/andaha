using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.DeleteBill.V1;

public record DeleteBillCommand(Guid Id) : IHttpRequest;
