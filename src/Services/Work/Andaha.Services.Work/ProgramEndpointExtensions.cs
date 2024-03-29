﻿using Andaha.Services.Work.Requests.Person;
using Andaha.Services.Work.Requests.Statistics;
using Andaha.Services.Work.Requests.WorkingEntry;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace Andaha.Services.Work;

public static class ProgramEndpointExtensions
{
    public static WebApplication MapWorkEndpoints(this WebApplication app)
    {
        app.MapPersonEndpoint();

        app.MapWorkingEntryEndpoint();

        app.MapStatisticsEndpoint();

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
