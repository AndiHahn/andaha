using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Infrastructure.Extensions;

internal static class ModelBuilderExtensions
{
    public static void ApplyUtcDateTimeConversion(this ModelBuilder builder)
    {
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    builder.Entity(entityType.ClrType)
                        .Property<DateTime>(property.Name)
                        .HasConversion(d => d, d => new DateTime(d.Ticks, DateTimeKind.Utc));
                }

                if (property.ClrType == typeof(DateTime?))
                {
                    builder.Entity(entityType.ClrType)
                        .Property<DateTime?>(property.Name)
                        .HasConversion(
                            d => d,
                            d => d == null ? d : new DateTime(d.Value.Ticks, DateTimeKind.Utc));
                }
            }
        }
    }
}
