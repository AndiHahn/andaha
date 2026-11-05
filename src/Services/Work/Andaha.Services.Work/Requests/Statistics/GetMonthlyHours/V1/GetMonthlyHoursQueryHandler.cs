using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Common;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Statistics.Dtos.V1;
using Andaha.Services.Work.Requests.Statistics.Extensions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Statistics.GetMonthlyHours.V1;

/// <summary>
/// Working hours per month for exactly <c>Months</c> months ending with <c>Until</c>, oldest first.
/// Months without entries are included with 0 hours. An entry counts in the local month (time zone <c>Tz</c>,
/// default Europe/Vienna) of its start.
/// </summary>
internal class GetMonthlyHoursQueryHandler : IRequestHandler<GetMonthlyHoursQuery, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetMonthlyHoursQueryHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetMonthlyHoursQuery request, CancellationToken cancellationToken)
    {
        var userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);
        var timeZone = LocalMonths.ResolveTimeZone(request.Tz);

        var untilMonth = LocalMonths.Parse(request.Until);
        var start = untilMonth.AddMonths(1 - request.Months);
        var startUtc = LocalMonths.StartUtc(start, timeZone);
        var endUtcExclusive = LocalMonths.StartUtc(untilMonth.AddMonths(1), timeZone);

        // Local months are computed in memory from the entries of the range.
        var entries = await this.dbContext.VisibleWorkingEntries(userId, connectedUsers, request.PersonFilter)
            .Where(entry => entry.From >= startUtc && entry.From < endUtcExclusive)
            .Select(entry => new { entry.From, entry.WorkDurationTicks })
            .ToListAsync(cancellationToken);

        var ticksPerMonth = entries
            .GroupBy(entry => LocalMonths.MonthOf(entry.From, timeZone))
            .ToDictionary(group => group.Key, group => group.Sum(entry => entry.WorkDurationTicks));

        var result = Enumerable.Range(0, request.Months)
            .Select(offset => start.AddMonths(offset))
            .Select(month => new MonthlyHoursDto(
                LocalMonths.ToMonthString(month),
                Math.Round(TimeSpan.FromTicks(ticksPerMonth.GetValueOrDefault(month)).TotalHours, 2)))
            .ToArray();

        return Results.Ok(result);
    }
}
