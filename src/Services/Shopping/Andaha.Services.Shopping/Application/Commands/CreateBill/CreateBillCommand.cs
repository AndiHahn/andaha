using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;

namespace Andaha.Services.Shopping.Application.Commands.CreateBill;

public record CreateBillCommand(Guid CategoryId, string ShopName, double Price, DateTime? Date, string? Notes) : IRequest<Result<BillDto>>;
