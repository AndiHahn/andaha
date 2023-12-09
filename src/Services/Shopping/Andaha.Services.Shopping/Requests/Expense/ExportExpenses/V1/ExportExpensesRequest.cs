using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Expense.ExportExpenses.V1;

public record ExportExpensesRequest(
    [FromQuery] DateTime StartTimeUtc,
    [FromQuery] DateTime EndTimeUtc) : IHttpRequest;
    //[FromQuery] IEnumerable<Guid>? CategoryFilter = null) : IHttpRequest;
