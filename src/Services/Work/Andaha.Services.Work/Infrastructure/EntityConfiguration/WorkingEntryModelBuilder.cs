using Andaha.Services.Work.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.Work.Infrastructure.EntityConfiguration;

public class WorkingEntryModelBuilder : IEntityTypeConfiguration<WorkingEntry>
{
    public void Configure(EntityTypeBuilder<WorkingEntry> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id).ValueGeneratedNever();

        builder.HasIndex(b => b.From);

        builder
            .Property(p => p.From)
            .HasColumnType("smalldatetime");

        builder
            .Property(p => p.Until)
            .HasColumnType("smalldatetime");

        builder
            .Property(p => p.Break)
            .HasColumnType("time");

        builder
            .Property(p => p.Notes)
            .IsRequired(false)
            .HasMaxLength(1000);
    }
}
