using Andaha.Services.BudgetPlan;
using Andaha.Services.Collaboration;
using Andaha.Services.Shopping;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace Andaha.Services.MonolithApi;

internal static class ProgramEndpointExtensions
{
    public static WebApplication MapMonolithEndpoints(this WebApplication app)
    {
        app.MapBudgetPlanEndpoints();

        app.MapCollaborationEndpoints();

        app.MapShoppingEndpoints();

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
}
