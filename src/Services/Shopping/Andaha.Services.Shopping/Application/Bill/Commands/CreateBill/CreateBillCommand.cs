using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;

namespace Andaha.Services.Shopping.Application.Commands.CreateBill;

public record CreateBillCommand(Guid? Id, Guid CategoryId, string ShopName, double Price, DateTime Date, string? Notes, IFormFile? Image) : IRequest<Result<BillDto>>;
