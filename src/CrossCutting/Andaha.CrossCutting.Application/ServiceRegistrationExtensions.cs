using Andaha.CrossCutting.Application.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Andaha.CrossCutting.Application;
public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddCrossCuttingApplication(this IServiceCollection services)
    {
        services.AddScoped<IIdentityService, IdentityService>();

        return services;
    }
}
