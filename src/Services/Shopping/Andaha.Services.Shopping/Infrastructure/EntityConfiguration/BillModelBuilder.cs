using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.Shopping.Infrastructure.EntityConfiguration;

public class BillModelBuilder : IEntityTypeConfiguration<Bill>
{
    public void Configure(EntityTypeBuilder<Bill> builder)
    {
        builder.HasKey(b => b.Id);

        builder
            .HasOne(b => b.Category)
            .WithMany(c => c.Bills)
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .Property(b => b.ShopName)
            .IsRequired()
            .HasMaxLength(200)
            .IsUnicode(false);

        builder
            .Property(b => b.Price)
            .IsRequired();

        builder
            .Property(b => b.Notes)
            .IsRequired(false)
            .HasMaxLength(1000);

        builder
            .Property(b => b.CreatedAt)
            .IsRequired(true)
            .HasDefaultValueSql("GETDATE()");
    }
}
