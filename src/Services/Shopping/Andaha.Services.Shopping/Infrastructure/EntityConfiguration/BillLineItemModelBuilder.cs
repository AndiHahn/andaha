using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.Shopping.Infrastructure.EntityConfiguration;

public class BillLineItemModelBuilder : IEntityTypeConfiguration<BillLineItem>
{
    public void Configure(EntityTypeBuilder<BillLineItem> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id).ValueGeneratedNever();

        builder
            .HasOne(b => b.Bill)
            .WithMany(l => l.LineItems)
            .HasForeignKey(b => b.BillId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .Property(b => b.Description)
            .HasMaxLength(200)
            .IsUnicode(false);
    }
}
