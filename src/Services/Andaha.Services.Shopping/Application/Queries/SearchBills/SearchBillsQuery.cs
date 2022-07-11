using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos;
using MediatR;

namespace Andaha.Services.Shopping.Application.SearchBills;

public record SearchBillsQuery(int PageSize, int PageIndex, string? Search) : IRequest<PagedResult<BillDto>>;
