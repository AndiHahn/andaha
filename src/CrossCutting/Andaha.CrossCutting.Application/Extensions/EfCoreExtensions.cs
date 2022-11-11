namespace Microsoft.EntityFrameworkCore;

public static class EfCoreExtensions
{
    public static ValueTask<TEntity?> FindByIdAsync<TEntity, TKey>(
            this DbSet<TEntity> dbSet,
            TKey key,
            CancellationToken cancellationToken = default)
            where TEntity : class
    {
        if (key is null)
        {
            throw new ArgumentNullException(nameof(key));
        }

        return dbSet.FindAsync(new object[] { key }, cancellationToken);
    }
}
