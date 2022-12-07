using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.DeleteBillImage.V1;

public record DeleteBillImageCommand(Guid Id) : IHttpRequest;
