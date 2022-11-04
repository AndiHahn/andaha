using Andaha.CrossCutting.Application.Result;
using MediatR;

namespace Andaha.Services.Shopping.Application.Bill.Commands.UploadBillImage;

public record UploadBillImageCommand(Guid BillId, IFormFile Image) : IRequest<Result>;
