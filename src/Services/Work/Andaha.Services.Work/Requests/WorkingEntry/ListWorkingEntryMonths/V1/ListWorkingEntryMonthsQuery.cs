using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.WorkingEntry.ListWorkingEntryMonths.V1;

/// <param name="PersonId">Person whose entries are listed.</param>
/// <param name="Until">Newest month to consider, format yyyy-MM. Without it the newest month with entries is used.</param>
/// <param name="Months">Number of months with entries to deliver (1-24), default 3.</param>
public record ListWorkingEntryMonthsQuery(
    Guid PersonId,
    [FromQuery] string? Until,
    [FromQuery] int? Months) : IHttpRequest
{
    public const int DefaultMonths = 3;
}
