using Andaha.Services.BudgetPlan.Core;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Infrastructure.EntityConfiguration;

public class FixedCostEntityConfiguration : IEntityTypeConfiguration<FixedCost>
{
    public void Configure(EntityTypeBuilder<FixedCost> builder)
    {
        builder.HasKey(entity => entity.Id);

        builder.ConfigureTemporalTable("FixedCost");

        builder.Property(entity => entity.Name).IsRequired().IsUnicode(false).HasMaxLength(200);

        builder.Property(entity => entity.Value).IsRequired();

        builder.Property(entity => entity.Duration).HasConversion(
            duration => duration.Value,
            duration => Duration.FromValue(duration));

        builder.Property(entity => entity.Category).HasConversion(
            category => category.Value,
            category => CostCategory.FromValue(category));
    }
}
