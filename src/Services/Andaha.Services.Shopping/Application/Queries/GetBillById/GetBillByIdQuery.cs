using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos;
using MediatR;

namespace Andaha.Services.Shopping.Application.GetBillById;

public record GetBillByIdQuery(Guid BillId) : IRequest<Result<BillDto>>;
