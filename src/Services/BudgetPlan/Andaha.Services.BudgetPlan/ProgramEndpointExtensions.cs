﻿using Andaha.Services.BudgetPlan.Requests.Income;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace Andaha.Services.BudgetPlan;

public static class ProgramEndpointExtensions
{
    internal static WebApplication MapEndpoints(this WebApplication app)
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

        app.MapIncomeEndpoint();

        return app;
    }

    internal static RouteGroupBuilder ApplyApiVersions(this RouteGroupBuilder groupBuilder)
        => groupBuilder
            .HasApiVersion(1.0)
            .HasApiVersion(2.0);
}
