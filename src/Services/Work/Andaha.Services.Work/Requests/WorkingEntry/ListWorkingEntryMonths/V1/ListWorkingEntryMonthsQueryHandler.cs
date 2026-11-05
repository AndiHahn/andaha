using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Common;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.WorkingEntry.ListWorkingEntryMonths.V1;

/// <summary>
/// Lists the entries of a person month by month: the newest months with entries up to <c>Until</c>,
/// always whole months (by <c>From</c>), so month sums computed from the result are complete.
/// Months are local months in the time zone <c>Tz</c> (default Europe/Vienna).
/// </summary>
internal class ListWorkingEntryMonthsQueryHandler : IRequestHandler<ListWorkingEntryMonthsQuery, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public ListWorkingEntryMonthsQueryHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(ListWorkingEntryMonthsQuery request, CancellationToken cancellationToken)
    {
        var userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        // Persons of other, not connected users behave as if they did not exist.
        bool personVisible = await this.dbContext.Person
            .AsNoTracking()
            .AnyAsync(
                person => person.Id == request.PersonId &&
                          (person.UserId == userId || connectedUsers.Contains(person.UserId)),
                cancellationToken);
        if (!personVisible)
        {
            return Results.NotFound($"Person with id '{request.PersonId}' not found.");
        }

        int monthCount = request.Months ?? ListWorkingEntryMonthsQuery.DefaultMonths;
        var timeZone = LocalMonths.ResolveTimeZone(request.Tz);

        var entries = this.dbContext.WorkingEntry
            .AsNoTracking()
            .Where(entry => entry.PersonId == request.PersonId);

        if (request.Until is not null)
        {
            var untilEndUtc = LocalMonths.StartUtc(LocalMonths.Parse(request.Until).AddMonths(1), timeZone);
            entries = entries.Where(entry => entry.From < untilEndUtc);
        }

        // Local months are computed in memory; the entries of one person are few.
        // One month more than requested tells whether older entries exist.
        var froms = await entries.Select(entry => entry.From).ToListAsync(cancellationToken);
        var months = froms
            .Select(from => LocalMonths.MonthOf(from, timeZone))
            .Distinct()
            .OrderDescending()
            .Take(monthCount + 1)
            .ToList();

        if (months.Count == 0)
        {
            return Results.Ok(new WorkingEntryMonthsDto([], null));
        }

        var oldestMonth = months[Math.Min(months.Count, monthCount) - 1];
        var oldestStartUtc = LocalMonths.StartUtc(oldestMonth, timeZone);

        string? nextUntil = months.Count > monthCount
            ? LocalMonths.ToMonthString(oldestMonth.AddMonths(-1))
            : null;

        var result = await entries
            .Where(entry => entry.From >= oldestStartUtc)
            .OrderByDescending(entry => entry.From)
            .Select(WorkingEntryDtoMapping.EntityToDto)
            .ToListAsync(cancellationToken);

        return Results.Ok(new WorkingEntryMonthsDto(result, nextUntil));
    }
}
