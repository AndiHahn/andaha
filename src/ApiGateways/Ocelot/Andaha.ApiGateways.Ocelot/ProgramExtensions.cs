using Microsoft.Extensions.Diagnostics.HealthChecks;
using Ocelot.DependencyInjection;

namespace Andaha.ApiGateways.Ocelot;

internal static class ProgramExtensions
{
    internal static WebApplicationBuilder AddCustomOcelot(this WebApplicationBuilder builder)
    {
        var ocelotConfiguration = new ConfigurationBuilder()
            .AddJsonFile("ocelot-configuration.json", false, true)
            .Build();

        builder.Services.AddOcelot(ocelotConfiguration);

        return builder;
    }

    internal static WebApplicationBuilder AddCustomHealthChecks(this WebApplicationBuilder builder)
    {
        builder.Services
            .AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy());

        return builder;
    }
}
