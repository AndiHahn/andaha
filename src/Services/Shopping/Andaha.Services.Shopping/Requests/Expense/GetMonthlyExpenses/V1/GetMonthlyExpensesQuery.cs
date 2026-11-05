using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Expense.GetMonthlyExpenses.V1;

/// <param name="Until">Last month of the series, format yyyy-MM.</param>
/// <param name="Months">Number of months in the series (1-24).</param>
public record GetMonthlyExpensesQuery(
    [FromQuery] string Until,
    [FromQuery] int Months) : IHttpRequest;
