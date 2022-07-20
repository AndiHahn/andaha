using Andaha.CrossCutting.Application.Result;
using MediatR;

namespace Andaha.Services.Shopping.Application.Commands.DeleteBill;

public record DeleteBillCommand(Guid BillId) : IRequest<Result>;
