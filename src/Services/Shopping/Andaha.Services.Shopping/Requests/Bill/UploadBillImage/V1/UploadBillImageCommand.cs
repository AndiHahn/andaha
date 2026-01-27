using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;

public record UploadBillImageCommand(Guid Id, IFormFile Image) : IHttpRequest;
