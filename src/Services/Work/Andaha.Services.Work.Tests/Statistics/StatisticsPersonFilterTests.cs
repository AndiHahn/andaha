using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Statistics.Dtos.V1;
using Andaha.Services.Work.Requests.Statistics.GetFullStatistics.V1;
using Andaha.Services.Work.Requests.Statistics.GetMonthlyHours.V1;
using Andaha.Services.Work.Requests.Statistics.GetStatistics.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using NSubstitute;

namespace Andaha.Services.Work.Tests.Statistics;

public sealed class StatisticsPersonFilterTests : IDisposable
{
    private static readonly DateTime RangeStart = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime RangeEnd = new(2026, 12, 31, 23, 59, 0, DateTimeKind.Utc);

    private readonly Guid userId = Guid.NewGuid();
    private readonly Guid connectedUserId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly IIdentityService identityService = Substitute.For<IIdentityService>();
    private readonly ICollaborationApiProxy collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();

    // Own persons A (10 €/h) and B (20 €/h), C (30 €/h) of a connected user, D (40 €/h) of a stranger.
    private readonly Guid personA;
    private readonly Guid personB;
    private readonly Guid personC;
    private readonly Guid personD;

    public StatisticsPersonFilterTests()
    {
        WorkDbContext seedContext;
        (seedContext, this.connection) = TestDb.CreateWork();
        this.identityService.GetUserId().Returns(this.userId);
        this.collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>())
            .Returns(new[] { this.connectedUserId });

        using (seedContext)
        {
            var a = new Core.Person(this.userId, "A", 10, null);
            var b = new Core.Person(this.userId, "B", 20, null);
            var c = new Core.Person(this.connectedUserId, "C", 30, null);
            var d = new Core.Person(Guid.NewGuid(), "D", 40, null);

            var january = new DateTime(2026, 1, 12, 8, 0, 0, DateTimeKind.Utc);
            var march = new DateTime(2026, 3, 3, 8, 0, 0, DateTimeKind.Utc);

            a.AddWorkingEntry(january, january.AddHours(2), TimeSpan.Zero, null);
            a.AddWorkingEntry(march, march.AddHours(2), TimeSpan.Zero, null);
            b.AddWorkingEntry(march, march.AddHours(3).AddMinutes(30), TimeSpan.FromMinutes(30), null);
            c.AddWorkingEntry(march, march.AddHours(4), TimeSpan.Zero, null);
            d.AddWorkingEntry(march, march.AddHours(5), TimeSpan.Zero, null);

            a.AddPayment(TimeSpan.FromHours(1), 10, 0, null);
            b.AddPayment(TimeSpan.FromHours(2), 40, 5, null);
            d.AddPayment(TimeSpan.FromHours(5), 200, 50, null);

            seedContext.Person.AddRange(a, b, c, d);
            seedContext.SaveChanges();

            (this.personA, this.personB, this.personC, this.personD) = (a.Id, b.Id, c.Id, d.Id);
        }
    }

    public void Dispose() => this.connection.Dispose();

    private async Task<StatisticsDto> Statistics(Guid[]? personFilter)
    {
        using var context = TestDb.Open(this.connection);
        var handler = new GetStatisticsRequestHandler(context, this.identityService, this.collaborationApiProxy);
        var result = await handler.Handle(
            new GetStatisticsRequest(new GetStatisticsParameters
            {
                StartTimeUtc = RangeStart,
                EndTimeUtc = RangeEnd,
                PersonFilter = personFilter,
            }),
            CancellationToken.None);
        return Assert.IsType<Ok<StatisticsDto>>(result).Value!;
    }

    private async Task<FullStatisticsDto> FullStatistics(Guid[]? personFilter)
    {
        using var context = TestDb.Open(this.connection);
        var handler = new GetFullStatisticsRequestHandler(context, this.identityService, this.collaborationApiProxy);
        var result = await handler.Handle(new GetFullStatisticsRequest(personFilter), CancellationToken.None);
        return Assert.IsType<Ok<FullStatisticsDto>>(result).Value!;
    }

    private async Task<MonthlyHoursDto[]> MonthlyHours(string until, int months, Guid[]? personFilter)
    {
        using var context = TestDb.Open(this.connection);
        var handler = new GetMonthlyHoursQueryHandler(context, this.identityService, this.collaborationApiProxy);
        var result = await handler.Handle(new GetMonthlyHoursQuery(until, months, personFilter), CancellationToken.None);
        return Assert.IsType<Ok<MonthlyHoursDto[]>>(result).Value!;
    }

    [Fact]
    public async Task Statistics_person_filter_limits_hours_and_money()
    {
        var all = await this.Statistics(null);
        Assert.Equal(TimeSpan.FromHours(11), all.TotalWorkingTime);
        Assert.Equal(40 + 60 + 120, all.ExtrapolatedMoneyToPay);

        var empty = await this.Statistics([]);
        Assert.Equal(all, empty);

        var onlyA = await this.Statistics([this.personA]);
        Assert.Equal(TimeSpan.FromHours(4), onlyA.TotalWorkingTime);
        Assert.Equal(40, onlyA.ExtrapolatedMoneyToPay);

        var bAndC = await this.Statistics([this.personB, this.personC]);
        Assert.Equal(TimeSpan.FromHours(7), bAndC.TotalWorkingTime);
        Assert.Equal(60 + 120, bAndC.ExtrapolatedMoneyToPay);

        // A person outside the own and connected persons yields nothing.
        var stranger = await this.Statistics([this.personD]);
        Assert.Equal(TimeSpan.Zero, stranger.TotalWorkingTime);
        Assert.Equal(0, stranger.ExtrapolatedMoneyToPay);
    }

    [Fact]
    public async Task Full_statistics_person_filter()
    {
        var all = await this.FullStatistics(null);
        Assert.Equal(TimeSpan.FromHours(11), all.TotalWorkingTime);
        Assert.Equal(50, all.PayedMoney);
        Assert.Equal(TimeSpan.FromHours(8), all.NotPayedHours);
        Assert.Equal(40 + 60 + 120 - 50 + 5, all.NotPayedMoney);

        Assert.Equal(all, await this.FullStatistics([]));

        var onlyB = await this.FullStatistics([this.personB]);
        Assert.Equal(TimeSpan.FromHours(3), onlyB.TotalWorkingTime);
        Assert.Equal(40, onlyB.PayedMoney);
        Assert.Equal(TimeSpan.FromHours(1), onlyB.NotPayedHours);
        Assert.Equal(60 - 40 + 5, onlyB.NotPayedMoney);

        var stranger = await this.FullStatistics([this.personD]);
        Assert.Equal(TimeSpan.Zero, stranger.TotalWorkingTime);
        Assert.Equal(0, stranger.PayedMoney);
        Assert.Equal(TimeSpan.Zero, stranger.NotPayedHours);
        Assert.Equal(0, stranger.NotPayedMoney);
    }

    [Fact]
    public async Task Monthly_hours_returns_exact_months_with_zero_gaps()
    {
        var all = await this.MonthlyHours("2026-04", 6, null);
        Assert.Equal(["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"], all.Select(m => m.Month));
        Assert.Equal([0, 0, 2, 0, 2 + 3 + 4, 0], all.Select(m => m.Hours));

        var onlyA = await this.MonthlyHours("2026-04", 6, [this.personA]);
        Assert.Equal([0, 0, 2, 0, 2, 0], onlyA.Select(m => m.Hours));

        var stranger = await this.MonthlyHours("2026-03", 2, [this.personD]);
        Assert.Equal(["2026-02", "2026-03"], stranger.Select(m => m.Month));
        Assert.All(stranger, month => Assert.Equal(0, month.Hours));

        var single = await this.MonthlyHours("2026-01", 1, []);
        Assert.Equal("2026-01", Assert.Single(single).Month);
        Assert.Equal(2, single[0].Hours);
    }
}
