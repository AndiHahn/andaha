using Andaha.Services.Work.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.Work.Infrastructure.EntityConfiguration;

public class PersonModelBuilder : IEntityTypeConfiguration<Person>
{
    public void Configure(EntityTypeBuilder<Person> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id).ValueGeneratedNever();

        builder
            .Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200)
            .IsUnicode(false);

        builder.HasIndex(p => p.Name);

        builder
            .Property(p => p.HourlyRate)
            .HasPrecision(4, 1)
            .IsRequired();

        builder
            .Property(p => p.PayedHous)
            .IsRequired();

        builder
            .Property(p => p.LastPayed)
            .HasColumnType("date");

        builder
            .Property(p => p.Notes)
            .IsRequired(false)
            .HasMaxLength(1000);

        builder
            .HasMany(p => p.WorkingEntries)
            .WithOne(w => w.Person)
            .HasForeignKey(w => w.PersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
