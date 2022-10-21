using Ocelot.Configuration.File;

namespace Andaha.ApiGateways.Ocelot;

public static class FileConfigurationExtensions
{
    public static IServiceCollection ConfigureDownstreamHostAndPortsPlaceholders(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.PostConfigure<FileConfiguration>(fileConfiguration =>
        {
            var globalHosts = configuration
                .GetSection("Hosts")
                .Get<GlobalHosts>();

            foreach (var route in fileConfiguration.Routes)
            {
                ConfigureRoute(route, globalHosts);
            }
        });

        return services;
    }

    private static void ConfigureRoute(FileRoute route, GlobalHosts hosts)
    {
        foreach (var hostAndPort in route.DownstreamHostAndPorts)
        {
            var host = hostAndPort.Host;
            if (host.StartsWith("{") && host.EndsWith("}"))
            {
                var placeHolder = host.TrimStart('{').TrimEnd('}');
                if (hosts.TryGetValue(placeHolder, out var uri))
                {
                    route.DownstreamScheme = uri.Scheme;
                    hostAndPort.Host = uri.Host;
                    hostAndPort.Port = uri.Port;
                }
            }
        }
    }
}
