using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;

public record UploadBillImageCommand(Guid Id, [FromForm] IFormFile Image) : IHttpRequest;
