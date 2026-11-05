using Andaha.Services.Work.Requests.Statistics.GetFullStatistics.V1;
using Andaha.Services.Work.Requests.Statistics.GetMonthlyHours.V1;
using Andaha.Services.Work.Requests.WorkingEntry.ListWorkingEntryMonths.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace Andaha.Services.Work.Tests;

/// <summary>
/// The endpoints bind their requests with [AsParameters] (MediateGet). These tests run the same binding
/// on the query string, e.g. the repeatable query parameter personFilter.
/// </summary>
public class QueryBindingTests
{
    private static async Task<T> Bind<T>(string queryString, string? personId = null)
    {
        T? bound = default;
        var factoryResult = RequestDelegateFactory.Create(([AsParameters] T request) => { bound = request; });

        var context = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddLogging().BuildServiceProvider(),
        };
        context.Request.QueryString = new QueryString(queryString);
        if (personId is not null)
        {
            context.Request.RouteValues["personId"] = personId;
        }

        await factoryResult.RequestDelegate(context);

        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
        return bound!;
    }

    [Fact]
    public async Task PersonFilter_binds_from_repeated_query_parameter()
    {
        Guid first = Guid.NewGuid();
        Guid second = Guid.NewGuid();

        var monthly = await Bind<GetMonthlyHoursQuery>($"?until=2026-04&months=12&personFilter={first}&personFilter={second}");
        Assert.Equal("2026-04", monthly.Until);
        Assert.Equal(12, monthly.Months);
        Assert.Equal([first, second], monthly.PersonFilter);

        var full = await Bind<GetFullStatisticsRequest>($"?personFilter={first}");
        Assert.Equal([first], full.PersonFilter);

        var fullWithoutFilter = await Bind<GetFullStatisticsRequest>(string.Empty);
        Assert.True(fullWithoutFilter.PersonFilter is null or { Length: 0 });
    }

    [Fact]
    public async Task Months_query_binds_route_and_optional_query()
    {
        Guid personId = Guid.NewGuid();

        var withQuery = await Bind<ListWorkingEntryMonthsQuery>("?until=2026-03&months=3", personId.ToString());
        Assert.Equal(new ListWorkingEntryMonthsQuery(personId, "2026-03", 3), withQuery);

        var withoutQuery = await Bind<ListWorkingEntryMonthsQuery>(string.Empty, personId.ToString());
        Assert.Equal(new ListWorkingEntryMonthsQuery(personId, null, null), withoutQuery);
    }
}
