using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using Andaha.Services.Work.Requests.WorkingEntry.ListWorkingEntryMonths.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using NSubstitute;

namespace Andaha.Services.Work.Tests.WorkingEntry;

public sealed class ListWorkingEntryMonthsTests : IDisposable
{
    // Five months with entries, with a gap (February 2026) and a year change.
    private static readonly (int Year, int Month)[] MonthsWithEntries =
        [(2025, 11), (2025, 12), (2026, 1), (2026, 3), (2026, 4)];

    private readonly Guid userId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly IIdentityService identityService = Substitute.For<IIdentityService>();
    private readonly ICollaborationApiProxy collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();
    private readonly Guid personId;
    private readonly Guid foreignPersonId;

    public ListWorkingEntryMonthsTests()
    {
        WorkDbContext seedContext;
        (seedContext, this.connection) = TestDb.CreateWork();
        this.identityService.GetUserId().Returns(this.userId);
        this.collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>())
            .Returns(Array.Empty<Guid>());

        using (seedContext)
        {
            var person = new Core.Person(this.userId, "Maria", 15, null);
            var otherPerson = new Core.Person(this.userId, "Josef", 15, null);
            var foreignPerson = new Core.Person(Guid.NewGuid(), "Fremd", 15, null);

            foreach (var (year, month) in MonthsWithEntries)
            {
                // First of the month just after midnight and last evening of the month: both belong to the month.
                var first = new DateTime(year, month, 1, 0, 30, 0, DateTimeKind.Utc);
                var last = new DateTime(year, month, DateTime.DaysInMonth(year, month), 20, 0, 0, DateTimeKind.Utc);
                person.AddWorkingEntry(first, first.AddHours(2), TimeSpan.Zero, null);
                person.AddWorkingEntry(last, last.AddHours(3), TimeSpan.Zero, null);
            }

            var february = new DateTime(2026, 2, 10, 8, 0, 0, DateTimeKind.Utc);
            otherPerson.AddWorkingEntry(february, february.AddHours(1), TimeSpan.Zero, null);
            foreignPerson.AddWorkingEntry(february, february.AddHours(1), TimeSpan.Zero, null);

            seedContext.Person.AddRange(person, otherPerson, foreignPerson);
            seedContext.SaveChanges();

            this.personId = person.Id;
            this.foreignPersonId = foreignPerson.Id;
        }
    }

    public void Dispose() => this.connection.Dispose();

    private async Task<IResult> List(Guid personId, string? until, int? months)
    {
        using var context = TestDb.Open(this.connection);
        var handler = new ListWorkingEntryMonthsQueryHandler(context, this.identityService, this.collaborationApiProxy);
        return await handler.Handle(new ListWorkingEntryMonthsQuery(personId, until, months), CancellationToken.None);
    }

    private async Task<WorkingEntryMonthsDto> ListOk(string? until, int? months)
    {
        var result = await this.List(this.personId, until, months);
        return Assert.IsType<Ok<WorkingEntryMonthsDto>>(result).Value!;
    }

    private static string[] MonthsOf(WorkingEntryMonthsDto dto)
        => dto.Entries.Select(entry => entry.From.ToString("yyyy-MM")).Distinct().ToArray();

    private static void AssertDescendingByFrom(WorkingEntryMonthsDto dto)
        => Assert.Equal(dto.Entries.OrderByDescending(entry => entry.From).Select(entry => entry.Id), dto.Entries.Select(entry => entry.Id));

    [Fact]
    public async Task Months_returns_three_full_months_and_next_until()
    {
        var dto = await this.ListOk(until: null, months: 3);

        Assert.Equal(["2026-04", "2026-03", "2026-01"], MonthsOf(dto));
        Assert.Equal(6, dto.Entries.Count);
        AssertDescendingByFrom(dto);
        Assert.Equal("2025-12", dto.NextUntil);

        // Without months the page size defaults to 3.
        var withDefault = await this.ListOk(until: null, months: null);
        Assert.Equal(dto.Entries.Select(e => e.Id), withDefault.Entries.Select(e => e.Id));
    }

    [Fact]
    public async Task Months_with_until_continues_from_there()
    {
        var dto = await this.ListOk(until: "2026-03", months: 3);

        Assert.Equal(["2026-03", "2026-01", "2025-12"], MonthsOf(dto));
        Assert.Equal(6, dto.Entries.Count);
        AssertDescendingByFrom(dto);
        Assert.Equal("2025-11", dto.NextUntil);

        // An until without own entries (February) starts with the next older month.
        var fromGap = await this.ListOk(until: "2026-02", months: 1);
        Assert.Equal(["2026-01"], MonthsOf(fromGap));
        Assert.Equal("2025-12", fromGap.NextUntil);
    }

    [Fact]
    public async Task Months_last_page_has_null_next()
    {
        var lastPage = await this.ListOk(until: "2025-12", months: 3);
        Assert.Equal(["2025-12", "2025-11"], MonthsOf(lastPage));
        Assert.Equal(4, lastPage.Entries.Count);
        Assert.Null(lastPage.NextUntil);

        var everything = await this.ListOk(until: null, months: 5);
        Assert.Equal(10, everything.Entries.Count);
        Assert.Null(everything.NextUntil);

        var beforeAll = await this.ListOk(until: "2025-10", months: 3);
        Assert.Empty(beforeAll.Entries);
        Assert.Null(beforeAll.NextUntil);
    }

    [Fact]
    public async Task Months_404_for_foreign_or_unknown_person()
    {
        Assert.IsType<NotFound<string>>(await this.List(this.foreignPersonId, null, 3));
        Assert.IsType<NotFound<string>>(await this.List(Guid.NewGuid(), null, 3));
    }
}
