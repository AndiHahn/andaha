using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.Shopping.Infrastructure.EntityConfiguration;

public class BillTemplateModelBuilder : IEntityTypeConfiguration<BillTemplate>
{
    public void Configure(EntityTypeBuilder<BillTemplate> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id).ValueGeneratedNever();

        builder.HasIndex(b => new { b.UserId, b.SortOrder });

        // No cascade: SQL Server rejects multiple cascade paths via BillCategory -> BillSubCategory.
        // Cleanup happens in the category handlers.
        builder
            .HasOne(b => b.Category)
            .WithMany()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(b => b.SubCategory)
            .WithMany()
            .HasForeignKey(b => b.SubCategoryId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .Property(b => b.Name)
            .IsRequired(false)
            .HasMaxLength(100);

        builder
            .Property(b => b.ShopName)
            .IsRequired(false)
            .HasMaxLength(200);

        builder
            .Property(b => b.SortOrder)
            .IsRequired()
            .HasDefaultValue(0);
    }
}
