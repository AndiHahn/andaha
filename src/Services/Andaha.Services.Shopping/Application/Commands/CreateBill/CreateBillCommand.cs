using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos;
using MediatR;

namespace Andaha.Services.Shopping.Application.CreateBill;

public record CreateBillCommand(Guid CategoryId, string ShopName, double Price, string? Notes) : IRequest<Result<BillDto>>;
