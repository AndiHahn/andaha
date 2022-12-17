using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Bill.SearchBills.V1;

public record SearchBillsQuery(
    [FromQuery] int PageSize,
    [FromQuery] int PageIndex,
    [FromQuery] string? Search,
    [FromQuery] string[]? CategoryFilter) : IHttpRequest;
