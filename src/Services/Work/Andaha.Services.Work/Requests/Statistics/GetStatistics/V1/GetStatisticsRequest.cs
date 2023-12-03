using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Statistics.GetStatistics.V1;

public record GetStatisticsRequest(
    [FromBody] GetStatisticsParameters Parameters) : IHttpRequest;
