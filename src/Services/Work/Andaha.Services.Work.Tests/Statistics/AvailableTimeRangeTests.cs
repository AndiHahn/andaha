using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Statistics.Dtos.V1;
using Andaha.Services.Work.Requests.Statistics.GetAvailableTimeRange.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Work.Tests.Statistics;

public class AvailableTimeRangeTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid PartnerB = Guid.NewGuid();

    private static async Task<TimeRangeDto> TimeRangeAsync(Action<WorkDbContext> seed)
    {
        var (context, connection) = TestDb.CreateWork();
        using (connection)
        using (context)
        {
            seed(context);

            var identity = Substitute.For<IIdentityService>();
            identity.GetUserId().Returns(UserA);
            var collaboration = Substitute.For<ICollaborationApiProxy>();
            collaboration.GetConnectedUsers(Arg.Any<CancellationToken>()).Returns(new[] { PartnerB });
            var handler = new GetAvailableTimeRangeRequestHandler(context, identity, collaboration);

            var result = await handler.Handle(new GetAvailableTimeRangeRequest(), CancellationToken.None);

            return Assert.IsType<Ok<TimeRangeDto>>(result).Value;
        }
    }

    private static void SeedEntry(WorkDbContext context, Guid userId, DateTime from, DateTime until)
    {
        var person = new Core.Person(userId, "P", 10, null);
        person.AddWorkingEntry(from, until, TimeSpan.Zero, null);
        context.Person.Add(person);
        context.SaveChanges();
    }

    [Fact]
    public async Task Time_range_of_account_without_entries_is_empty_when_database_has_no_entries()
    {
        var range = await TimeRangeAsync(_ => { });

        Assert.Equal(default, range);
    }

    [Fact]
    public async Task Time_range_of_account_without_entries_is_empty_when_other_users_have_entries()
    {
        var range = await TimeRangeAsync(context => SeedEntry(
            context,
            Guid.NewGuid(),
            new DateTime(2026, 3, 3, 8, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 3, 3, 10, 0, 0, DateTimeKind.Utc)));

        Assert.Equal(default, range);
    }

    [Fact]
    public async Task Time_range_spans_own_and_connected_entries()
    {
        var range = await TimeRangeAsync(context =>
        {
            SeedEntry(
                context,
                UserA,
                new DateTime(2026, 1, 12, 8, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 1, 12, 10, 0, 0, DateTimeKind.Utc));
            SeedEntry(
                context,
                PartnerB,
                new DateTime(2026, 3, 3, 8, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 3, 3, 12, 0, 0, DateTimeKind.Utc));
        });

        Assert.Equal(new DateTime(2026, 1, 12, 8, 0, 0), range.StartTimeUtc);
        Assert.Equal(new DateTime(2026, 3, 3, 12, 0, 0), range.EndTimeUtc);
    }
}
