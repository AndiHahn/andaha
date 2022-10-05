using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Andaha.CrossCutting.Application.Database;
internal class AndahaModelCacheKeyFactory<TContext> : IModelCacheKeyFactory
    where TContext : DbContext
{
    public object Create(DbContext context) => Create(context, false);

    public object Create(DbContext context, bool designTime)
    {
        return (new AndahaModelCacheKey<TContext>(context), designTime);
    }
}
