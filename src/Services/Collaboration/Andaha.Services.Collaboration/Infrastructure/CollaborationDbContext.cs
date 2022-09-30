using Andaha.Services.Collaboration.Core;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Andaha.Services.Collaboration.Infrastructure;

public class CollaborationDbContext : DbContext
{
    public DbSet<ConnectionRequest> ConnectionRequest { get; set; } = null!;
    public DbSet<Connection> Connection { get; set; } = null!;

    public CollaborationDbContext(DbContextOptions<CollaborationDbContext> options)
            : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
