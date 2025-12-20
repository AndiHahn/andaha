using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.Shopping.Infrastructure.EntityConfiguration;

public class AnalyzedBillModelBuilder : IEntityTypeConfiguration<AnalyzedBill>
{
    public void Configure(EntityTypeBuilder<AnalyzedBill> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id).ValueGeneratedNever();

        builder.HasIndex(b => b.Date);

        builder
            .Property(b => b.ShopName)
            .IsRequired()
            .HasMaxLength(200)
            .IsUnicode(false);

        builder
            .Property(b => b.Price)
            .IsRequired();

        builder
            .Property(b => b.Date)
            .HasColumnType("date");

        builder
            .Property(b => b.CreatedAt)
            .IsRequired(true)
            .HasDefaultValueSql("GETDATE()");
    }
}
