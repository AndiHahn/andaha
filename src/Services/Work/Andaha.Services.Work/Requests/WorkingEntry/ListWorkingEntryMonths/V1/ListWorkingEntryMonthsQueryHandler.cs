using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace Andaha.Services.Work.Requests.WorkingEntry.ListWorkingEntryMonths.V1;

/// <summary>
/// Lists the entries of a person month by month: the newest months with entries up to <c>Until</c>,
/// always whole months (by <c>From</c>), so month sums computed from the result are complete.
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

        var entries = this.dbContext.WorkingEntry
            .AsNoTracking()
            .Where(entry => entry.PersonId == request.PersonId);

        if (request.Until is not null)
        {
            var untilEndExclusive = DateTime
                .ParseExact(request.Until, "yyyy-MM", CultureInfo.InvariantCulture)
                .AddMonths(1);
            entries = entries.Where(entry => entry.From < untilEndExclusive);
        }

        // One month more than requested tells whether older entries exist.
        var months = await entries
            .Select(entry => new { entry.From.Year, entry.From.Month })
            .Distinct()
            .OrderByDescending(month => month.Year)
            .ThenByDescending(month => month.Month)
            .Take(monthCount + 1)
            .ToListAsync(cancellationToken);

        if (months.Count == 0)
        {
            return Results.Ok(new WorkingEntryMonthsDto([], null));
        }

        var oldest = months[Math.Min(months.Count, monthCount) - 1];
        var oldestStart = new DateTime(oldest.Year, oldest.Month, 1);

        string? nextUntil = months.Count > monthCount
            ? oldestStart.AddMonths(-1).ToString("yyyy-MM", CultureInfo.InvariantCulture)
            : null;

        var result = await entries
            .Where(entry => entry.From >= oldestStart)
            .OrderByDescending(entry => entry.From)
            .Select(WorkingEntryDtoMapping.EntityToDto)
            .ToListAsync(cancellationToken);

        return Results.Ok(new WorkingEntryMonthsDto(result, nextUntil));
    }
}
