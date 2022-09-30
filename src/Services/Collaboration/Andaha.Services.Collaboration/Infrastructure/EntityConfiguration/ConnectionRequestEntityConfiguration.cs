using Andaha.Services.Collaboration.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.Collaboration.Infrastructure.EntityConfiguration;

public class ConnectionRequestEntityConfiguration : IEntityTypeConfiguration<ConnectionRequest>
{
    public void Configure(EntityTypeBuilder<ConnectionRequest> builder)
    {
        builder.HasKey(entity => entity.Id);

        builder.HasIndex(entity => new { entity.FromUserId, entity.TargetUserId });

        builder
            .Property(entity => entity.FromUserEmail)
            .HasMaxLength(200)
            .IsUnicode(false);

        builder
            .Property(entity => entity.TargetUserEmail)
            .HasMaxLength(200)
            .IsUnicode(false);
    }
}
