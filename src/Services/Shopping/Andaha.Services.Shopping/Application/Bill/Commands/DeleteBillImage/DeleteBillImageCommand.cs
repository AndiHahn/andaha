using Andaha.CrossCutting.Application.Result;
using MediatR;

namespace Andaha.Services.Shopping.Application.Bill.Commands.DeleteBillImage;

public record DeleteBillImageCommand(Guid BillId) : IRequest<Result>;
