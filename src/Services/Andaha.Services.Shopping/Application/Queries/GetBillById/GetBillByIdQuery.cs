using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;

namespace Andaha.Services.Shopping.Application.Queries.GetBillById;

public record GetBillByIdQuery(Guid BillId) : IRequest<Result<BillDto>>;
