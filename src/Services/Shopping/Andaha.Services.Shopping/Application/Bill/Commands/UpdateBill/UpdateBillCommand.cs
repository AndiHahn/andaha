using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;

namespace Andaha.Services.Shopping.Application.Bill.Commands.UpdateBill;

public record UpdateBillCommand(Guid Id, Guid CategoryId, string ShopName, double Price, DateTime Date, string? Notes) : IRequest<Result<BillDto>>;
