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

        // Make FK properties optional
        builder.Property(billImage => billImage.BillId).IsRequired(false);
        builder.Property(billImage => billImage.AnalyzedBillId).IsRequired(false);

        // Relationship to Bill (optional)
        builder
            .HasOne(billImage => billImage.Bill)
            .WithMany(bill => bill.Images)
            .HasForeignKey(billImage => billImage.BillId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship to AnalyzedBill (optional)
        builder
            .HasOne(billImage => billImage.AnalyzedBill)
            .WithMany(analyzed => analyzed.Images)
            .HasForeignKey(billImage => billImage.AnalyzedBillId)
            .OnDelete(DeleteBehavior.Restrict);

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
