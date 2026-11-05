using Andaha.Services.BudgetPlan.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.BudgetPlan.Infrastructure.EntityConfiguration;

internal class BudgetPlanSettingsEntityConfiguration : IEntityTypeConfiguration<BudgetPlanSettings>
{
    public void Configure(EntityTypeBuilder<BudgetPlanSettings> builder)
    {
        builder.ToTable("BudgetPlanSettings");

        builder.HasKey(entity => entity.UserId);

        builder.Property(entity => entity.UserId).ValueGeneratedNever();

        builder.Property(entity => entity.LivingCostShare).IsRequired();
    }
}
