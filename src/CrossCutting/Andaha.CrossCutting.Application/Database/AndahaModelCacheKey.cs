using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Andaha.CrossCutting.Application.Database;
internal class AndahaModelCacheKey<TContext> : ModelCacheKey
    where TContext : DbContext
{
    private readonly Guid userId;

    public AndahaModelCacheKey(DbContext context)
        : base(context)
    {
        if (!(context is AndahaDbContext<TContext> andahaDbContext))
        {
            throw new InvalidOperationException($"Andaha model cache key can only be used for {nameof(AndahaDbContext<TContext>)}.");
        }

        this.userId = andahaDbContext.UserId;
    }

    public override bool Equals(object? obj) => base.Equals(obj);

    public override int GetHashCode() => this.userId.GetHashCode();

    protected override bool Equals(ModelCacheKey other)
        => base.Equals(other) && (other as AndahaModelCacheKey<TContext>)?.userId == this.userId;
}
