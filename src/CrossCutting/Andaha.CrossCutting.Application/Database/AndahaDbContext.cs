using Andaha.CrossCutting.Application.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Andaha.CrossCutting.Application.Database;
public class AndahaDbContext<TContext> : DbContext
    where TContext : DbContext
{
    private readonly IIdentityService identityService;
    private readonly IConnectedUsersService connectedUsersService;

    public AndahaDbContext(
        DbContextOptions<TContext> options,
        IIdentityService identityService,
        IConnectedUsersService connectedUsersService)
        : base(options)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.connectedUsersService = connectedUsersService ?? throw new ArgumentNullException(nameof(connectedUsersService));
    }

    public Guid UserId => this.identityService.GetUserId();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        optionsBuilder.ReplaceService<IModelCacheKeyFactory, AndahaModelCacheKeyFactory<TContext>>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyGlobalQueryFilter<IUserDependentEntity>(
            entity => entity.UserId == this.UserId);

        modelBuilder.ApplyGlobalQueryFilter<IShareableEntity>(
            entity => entity.UserId == this.UserId || this.connectedUsersService.GetConnectedUserIds().Contains(entity.UserId));
    }
}
