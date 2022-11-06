using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Andaha.Services.BudgetPlan.Infrastructure.EntityConfiguration;

internal static class TemporalTable
{
    /// <summary>
    /// Name of temporal table period start column
    /// Do not change this name, as it has influence on the database column names
    /// </summary>
    public static string ValidFrom = "ValidFrom";

    /// <summary>
    /// Name of temporal table period end column
    /// Do not change this name, as it has influence on the database column names
    /// </summary>
    public static string ValidTo = "ValidTo";

    public static DateTime AccessValidFrom(object entity) => EF.Property<DateTime>(entity, ValidFrom);

    public static DateTime AccessValidTo(object entity) => EF.Property<DateTime>(entity, ValidTo);

    public static void ConfigureTemporalTable<TEntity>(this EntityTypeBuilder<TEntity> builder, string tableName)
        where TEntity : class
    {
        builder.ToTable(
            tableName,
            config => config.IsTemporal(temporal =>
            {
                temporal.HasPeriodStart(ValidFrom);
                temporal.HasPeriodEnd(ValidTo);
            }));
    }
}
