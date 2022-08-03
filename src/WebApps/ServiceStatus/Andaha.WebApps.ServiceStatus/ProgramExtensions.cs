using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Andaha.WebApps.ServiceStatus;

internal static class ProgramExtensions
{
    internal static WebApplicationBuilder AddCustomHealthChecks(this WebApplicationBuilder builder)
    {
        builder.Services
            .AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy());

        return builder;
    }
}
