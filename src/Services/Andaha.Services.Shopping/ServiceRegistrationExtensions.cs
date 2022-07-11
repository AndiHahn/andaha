using Andaha.Services.Shopping.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ShoppingDbContext>(options
            => options.UseSqlServer(configuration.GetConnectionString("ApplicationDbConnection")));

        return services;
    }
}
