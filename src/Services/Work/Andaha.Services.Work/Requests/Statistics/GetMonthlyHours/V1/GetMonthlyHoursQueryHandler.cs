using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Statistics.Dtos.V1;
using Andaha.Services.Work.Requests.Statistics.Extensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace Andaha.Services.Work.Requests.Statistics.GetMonthlyHours.V1;

/// <summary>
/// Working hours per month for exactly <c>Months</c> months ending with <c>Until</c>, oldest first.
/// Months without entries are included with 0 hours. An entry counts in the month of its start.
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

        var untilMonth = DateTime.ParseExact(request.Until, "yyyy-MM", CultureInfo.InvariantCulture);
        var start = untilMonth.AddMonths(1 - request.Months);
        var endExclusive = untilMonth.AddMonths(1);

        var sums = await this.dbContext.VisibleWorkingEntries(userId, connectedUsers, request.PersonFilter)
            .Where(entry => entry.From >= start && entry.From < endExclusive)
            .GroupBy(entry => new { entry.From.Year, entry.From.Month })
            .Select(group => new
            {
                group.Key.Year,
                group.Key.Month,
                Ticks = group.Sum(entry => entry.WorkDurationTicks)
            })
            .ToListAsync(cancellationToken);

        var result = Enumerable.Range(0, request.Months)
            .Select(offset => start.AddMonths(offset))
            .Select(month => new MonthlyHoursDto(
                month.ToString("yyyy-MM", CultureInfo.InvariantCulture),
                Math.Round(
                    TimeSpan.FromTicks(sums
                        .Where(sum => sum.Year == month.Year && sum.Month == month.Month)
                        .Sum(sum => sum.Ticks))
                    .TotalHours,
                    2)))
            .ToArray();

        return Results.Ok(result);
    }
}
