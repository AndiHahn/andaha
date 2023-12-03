using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Statistics.GetFullStatistics.V1;

public record GetFullStatisticsRequest(
    [FromBody] GetFullStatisticsParameters Parameters) : IHttpRequest;
