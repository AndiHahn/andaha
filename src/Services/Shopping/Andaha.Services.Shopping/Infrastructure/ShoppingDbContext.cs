using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Andaha.Services.Shopping.Infrastructure;

public class ShoppingDbContext : DbContext
{
    public DbSet<Bill> Bill { get; set; } = null!;
    public DbSet<BillCategory> BillCategory { get; set; } = null!;

    public ShoppingDbContext(
        DbContextOptions<ShoppingDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        modelBuilder.ApplyUtcDateTimeConversion();
    }
}
