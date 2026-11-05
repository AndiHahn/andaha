using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Statistics.GetFullStatistics.V1;

/// <param name="PersonFilter">Optional person ids (repeatable query parameter). Empty or missing means all own and connected persons.</param>
public record GetFullStatisticsRequest(
    [FromQuery] Guid[]? PersonFilter = null) : IHttpRequest;
