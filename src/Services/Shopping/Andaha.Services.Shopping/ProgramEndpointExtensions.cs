using Andaha.Services.Shopping.Requests.Bill;
using Andaha.Services.Shopping.Requests.BillCategory;
using Andaha.Services.Shopping.Requests.Expense;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace Andaha.Services.Shopping;

public static class ProgramEndpointExtensions
{
    public static WebApplication MapShoppingEndpoints(this WebApplication app)
    {
        app.MapBillEndpoint();

        app.MapBillCategoryEndpoint();

        app.MapExpenseEndpoint();

        app.UseCloudEvents();
        app.MapSubscribeHandler();

        return app;
    }

    internal static WebApplication MapHealthChecks(this WebApplication app)
    {
        var versionSet = app.NewApiVersionSet().ReportApiVersions().Build();

        app.MapHealthChecks("/hc", new HealthCheckOptions
        {
            Predicate = _ => true,
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        }).WithApiVersionSet(versionSet).IsApiVersionNeutral();

        app.MapHealthChecks("/liveness", new HealthCheckOptions
        {
            Predicate = r => r.Name.Contains("self")
        }).WithApiVersionSet(versionSet).IsApiVersionNeutral();

        app.MapGet("/api/ping", Results.NoContent).WithApiVersionSet(versionSet).IsApiVersionNeutral();

        return app;
    }

    internal static RouteGroupBuilder ApplyApiVersions(this RouteGroupBuilder groupBuilder)
        => groupBuilder.HasApiVersion(1.0);
}
