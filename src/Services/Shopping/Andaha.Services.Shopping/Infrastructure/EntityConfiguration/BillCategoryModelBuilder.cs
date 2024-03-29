﻿using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.Shopping.Infrastructure.EntityConfiguration;

public class BillCategoryModelBuilder : IEntityTypeConfiguration<BillCategory>
{
    public void Configure(EntityTypeBuilder<BillCategory> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id).ValueGeneratedNever();

        builder.HasIndex(b => b.Name);

        builder
            .Property(b => b.Name)
            .IsRequired()
            .HasMaxLength(200)
            .IsUnicode(false);

        builder
            .Property(b => b.Color)
            .IsRequired()
            .HasMaxLength(20)
            .IsUnicode(false);

        builder
            .Property(b => b.IncludeToStatistics)
            .IsRequired()
            .HasDefaultValue(true);
        
        builder
            .Property(b => b.Order)
            .IsRequired()
            .HasDefaultValue(0);
    }
}
