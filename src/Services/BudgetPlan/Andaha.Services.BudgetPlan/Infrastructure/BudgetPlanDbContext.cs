using Andaha.Services.BudgetPlan.Core;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Andaha.Services.BudgetPlan.Infrastructure;

public class BudgetPlanDbContext : DbContext
{
    public DbSet<Income> Income { get; set; } = null!;

    public DbSet<FixedCost> FixedCost { get; set; } = null!;

    public BudgetPlanDbContext(DbContextOptions<BudgetPlanDbContext> options)
		: base(options)
	{
	}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
