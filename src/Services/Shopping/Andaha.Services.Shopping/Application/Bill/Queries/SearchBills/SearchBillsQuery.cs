using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;

namespace Andaha.Services.Shopping.Application.Queries.SearchBills;

public record SearchBillsQuery(int PageSize, int PageIndex, string? Search) : IRequest<PagedResult<BillDto>>;
