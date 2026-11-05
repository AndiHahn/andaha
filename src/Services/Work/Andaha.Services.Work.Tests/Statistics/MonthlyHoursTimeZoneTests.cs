using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Statistics.Dtos.V1;
using Andaha.Services.Work.Requests.Statistics.GetMonthlyHours.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using NSubstitute;

namespace Andaha.Services.Work.Tests.Statistics;

/// <summary>
/// Entries are stored as UTC instants; the monthly series counts them in the user's local month.
/// </summary>
public sealed class MonthlyHoursTimeZoneTests : IDisposable
{
    private static readonly TimeZoneInfo Vienna = TimeZoneInfo.FindSystemTimeZoneById("Europe/Vienna");

    private readonly Guid userId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly IIdentityService identityService = Substitute.For<IIdentityService>();
    private readonly ICollaborationApiProxy collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();

    public MonthlyHoursTimeZoneTests()
    {
        WorkDbContext seedContext;
        (seedContext, this.connection) = TestDb.CreateWork();
        this.identityService.GetUserId().Returns(this.userId);
        this.collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>())
            .Returns(Array.Empty<Guid>());

        using (seedContext)
        {
            var person = new Core.Person(this.userId, "Maria", 15, null);

            // 1st of the month at 00:30 local time: CET in March and November, CEST in April.
            AddLocal(person, new DateTime(2026, 3, 1, 0, 30, 0), hours: 2);   // 2026-02-28 23:30 UTC
            AddLocal(person, new DateTime(2026, 4, 1, 0, 30, 0), hours: 3);   // 2026-03-31 22:30 UTC
            AddLocal(person, new DateTime(2026, 11, 1, 0, 30, 0), hours: 4);  // 2026-10-31 23:30 UTC
            AddLocal(person, new DateTime(2026, 10, 31, 22, 0, 0), hours: 1); // 2026-10-31 21:00 UTC

            seedContext.Person.Add(person);
            seedContext.SaveChanges();
        }
    }

    public void Dispose() => this.connection.Dispose();

    private static void AddLocal(Core.Person person, DateTime local, int hours)
    {
        var from = DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeToUtc(local, Vienna), DateTimeKind.Utc);
        person.AddWorkingEntry(from, from.AddHours(hours), TimeSpan.Zero, null);
    }

    private async Task<Dictionary<string, double>> MonthlyHours(string until, int months, string? tz)
    {
        using var context = TestDb.Open(this.connection);
        var handler = new GetMonthlyHoursQueryHandler(context, this.identityService, this.collaborationApiProxy);
        var result = await handler.Handle(new GetMonthlyHoursQuery(until, months, null, tz), CancellationToken.None);
        var series = Assert.IsType<Ok<MonthlyHoursDto[]>>(result).Value!;
        Assert.Equal(months, series.Length);
        return series.ToDictionary(month => month.Month, month => month.Hours);
    }

    [Fact]
    public async Task Monthly_hours_count_first_of_month_00_30_in_the_local_month_by_default()
    {
        var byDefault = await this.MonthlyHours("2026-11", 10, tz: null);

        Assert.Equal(0, byDefault["2026-02"]);
        Assert.Equal(2, byDefault["2026-03"]);
        Assert.Equal(3, byDefault["2026-04"]);
        Assert.Equal(1, byDefault["2026-10"]);
        Assert.Equal(4, byDefault["2026-11"]);

        Assert.Equal(byDefault, await this.MonthlyHours("2026-11", 10, tz: "Europe/Vienna"));

        // The same instants counted in UTC months land one month earlier.
        var utc = await this.MonthlyHours("2026-11", 10, tz: "UTC");
        Assert.Equal(2, utc["2026-02"]);
        Assert.Equal(3, utc["2026-03"]);
        Assert.Equal(0, utc["2026-04"]);
        Assert.Equal(5, utc["2026-10"]);
        Assert.Equal(0, utc["2026-11"]);
    }

    [Fact]
    public async Task Monthly_hours_range_ends_at_the_local_month_boundary()
    {
        // Until 2026-02 local: the entry at 2026-02-28 23:30 UTC is already March in Vienna.
        var february = await this.MonthlyHours("2026-02", 1, tz: null);
        Assert.Equal(0, february["2026-02"]);

        // From 2026-04 local: the entry at 2026-03-31 22:30 UTC is already April in Vienna.
        var april = await this.MonthlyHours("2026-04", 1, tz: null);
        Assert.Equal(3, april["2026-04"]);
    }

    [Fact]
    public void Monthly_hours_rejects_unknown_time_zone()
    {
        var validator = new GetMonthlyHoursQueryValidator();

        var invalid = validator.Validate(new GetMonthlyHoursQuery("2026-04", 12, null, "Mars/Olympus"));
        Assert.False(invalid.IsValid);
        Assert.Contains(invalid.Errors, error => error.PropertyName == "Tz");

        Assert.True(validator.Validate(new GetMonthlyHoursQuery("2026-04", 12, null, "Europe/Vienna")).IsValid);
        Assert.True(validator.Validate(new GetMonthlyHoursQuery("2026-04", 12)).IsValid);
    }
}
