using Andaha.CrossCutting.Application;
using Andaha.Services.Shopping.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Andaha.Services.Shopping;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddCqrs(Assembly.GetExecutingAssembly());
        services.AddIdentityService();

        return services;
    }

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ShoppingDbContext>(options
            => options.UseSqlServer(configuration.GetConnectionString("ApplicationDbConnection")));

        return services;
    }
}
