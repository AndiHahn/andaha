using Andaha.Services.Work.Core;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Infrastructure.EntityConfiguration;

public class PaymentModelBuilder : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id).ValueGeneratedNever();

        builder
            .Property(p => p.PayedHoursTicks)
            .IsRequired();

        builder
            .Property(p => p.PayedAt)
            .HasColumnType("date");

        builder
            .Property(p => p.Notes)
            .IsRequired(false)
            .HasMaxLength(1000);
    }
}