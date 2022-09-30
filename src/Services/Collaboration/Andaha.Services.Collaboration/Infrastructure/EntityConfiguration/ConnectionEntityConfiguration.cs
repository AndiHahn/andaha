using Andaha.Services.Collaboration.Core;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Infrastructure.EntityConfiguration;

public class ConnectionEntityConfiguration : IEntityTypeConfiguration<Connection>
{
    public void Configure(EntityTypeBuilder<Connection> builder)
    {
        builder.HasKey(entity => entity.Id);

        builder.HasIndex(entity => new { entity.FromUserId, entity.TargetUserId });
    }
}
