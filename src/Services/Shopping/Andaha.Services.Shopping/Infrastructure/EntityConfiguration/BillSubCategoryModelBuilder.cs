using Andaha.Services.Shopping.Core;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Infrastructure.EntityConfiguration;

public class BillSubCategoryModelBuilder : IEntityTypeConfiguration<BillSubCategory>
{
    public void Configure(EntityTypeBuilder<BillSubCategory> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id).ValueGeneratedNever();

        builder
            .HasOne(b => b.Category)
            .WithMany(b => b.SubCategories)
            .HasForeignKey(b => b.CategoryId);

        builder
            .Property(b => b.Name)
            .IsRequired()
            .HasMaxLength(200)
            .IsUnicode(false);
    }
}
