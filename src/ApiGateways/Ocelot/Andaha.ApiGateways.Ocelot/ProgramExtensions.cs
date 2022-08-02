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

        builder.Services.ConfigureDownstreamHostAndPortsPlaceholders(builder.Configuration);

        return builder;
    }
}
