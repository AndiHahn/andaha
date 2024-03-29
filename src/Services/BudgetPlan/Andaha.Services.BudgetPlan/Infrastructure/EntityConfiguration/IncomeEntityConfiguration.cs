﻿using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using Andaha.Services.BudgetPlan.Core;

namespace Andaha.Services.BudgetPlan.Infrastructure.EntityConfiguration;

public class IncomeEntityConfiguration : IEntityTypeConfiguration<Income>
{
    public void Configure(EntityTypeBuilder<Income> builder)
    {
        builder.HasKey(entity => entity.Id);

        builder.ConfigureTemporalTable("Income");

        builder.Property(entity => entity.Name).IsRequired().IsUnicode(false).HasMaxLength(200);

        builder.Property(entity => entity.Value).IsRequired();

        builder.Property(entity => entity.Duration).HasConversion(
            duration => duration.Value,
            duration => Duration.FromValue(duration));
    }
}
