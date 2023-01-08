using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.Shopping.Infrastructure.EntityConfiguration;

public class BillImageModelBuilder : IEntityTypeConfiguration<BillImage>
{
    public void Configure(EntityTypeBuilder<BillImage> builder)
    {
        builder.HasKey(billImage => billImage.Id);

        builder.Property(billImage => billImage.Id).ValueGeneratedNever();

        builder
            .HasOne(billImage => billImage.Bill)
            .WithMany(bill => bill.Images)
            .HasForeignKey(billImage => billImage.BillId);

        builder
            .Property(billImage => billImage.Name)
            .IsRequired()
            .HasMaxLength(200)
            .IsUnicode(false);

        builder
            .Property(b => b.CreatedAt)
            .IsRequired(true)
            .HasDefaultValueSql("GETDATE()");
    }
}
