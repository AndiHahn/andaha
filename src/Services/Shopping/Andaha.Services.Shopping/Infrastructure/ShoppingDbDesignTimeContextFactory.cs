using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore;
using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application;

namespace Andaha.Services.Shopping.Infrastructure;

public class ShoppingDbDesignTimeContextFactory : IDesignTimeDbContextFactory<ShoppingDbContext>
{
    public ShoppingDbContext CreateDbContext(string[] args)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.Development.json", false)
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<ShoppingDbContext>();
        optionsBuilder.UseSqlServer(configuration.GetConnectionString("ApplicationDbConnection"));

        var identityService = new ManualIdentityService();

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddIdentityServices();
        var serviceProvider = serviceCollection.BuildServiceProvider();

        var connectedUsersService = serviceProvider.GetRequiredService<IConnectedUsersService>();

        return new ShoppingDbContext(optionsBuilder.Options, identityService, connectedUsersService);
    }
}
