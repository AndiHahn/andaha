using Andaha.CrossCutting.Application.Database;
using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Andaha.Services.Shopping.Infrastructure;

public class ShoppingDbContext : AndahaDbContext<ShoppingDbContext>
{
    public DbSet<Bill> Bill { get; set; } = null!;
    public DbSet<BillCategory> BillCategory { get; set; } = null!;

    public ShoppingDbContext(
        DbContextOptions<ShoppingDbContext> options,
        IIdentityService identityService,
        IConnectedUsersService connectedUsersService)
        : base(options, identityService, connectedUsersService)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
