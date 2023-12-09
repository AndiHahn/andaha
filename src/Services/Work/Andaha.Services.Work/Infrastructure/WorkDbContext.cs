using System.Reflection;
using Andaha.Services.Work.Core;
using Andaha.Services.Work.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Infrastructure;

public class WorkDbContext : DbContext
{
    public DbSet<Person> Person { get; set; } = null!;
    public DbSet<WorkingEntry> WorkingEntry { get; set; } = null!;
    public DbSet<Payment> Payment { get; set; } = null!;

    public WorkDbContext(
        DbContextOptions<WorkDbContext> options)
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
