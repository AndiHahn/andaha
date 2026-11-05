using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Statistics.GetMonthlyHours.V1;

/// <param name="Until">Last month of the series, format yyyy-MM.</param>
/// <param name="Months">Number of months in the series (1-24).</param>
/// <param name="PersonFilter">Optional person ids (repeatable query parameter). Empty or missing means all own and connected persons.</param>
public record GetMonthlyHoursQuery(
    [FromQuery] string Until,
    [FromQuery] int Months,
    [FromQuery] Guid[]? PersonFilter = null) : IHttpRequest;
