using Andaha.CrossCutting.Application.Result;
using MediatR;

namespace Andaha.Services.Shopping.Application.DeleteBill;

public record DeleteBillCommand(Guid BillId) : IRequest<Result>;
