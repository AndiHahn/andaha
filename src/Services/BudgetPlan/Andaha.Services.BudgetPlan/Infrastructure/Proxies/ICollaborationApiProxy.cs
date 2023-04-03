namespace Andaha.Services.Shopping.Infrastructure.Proxies;

internal interface ICollaborationApiProxy
{
    Task<IReadOnlyCollection<Guid>> GetConnectedUsersAsync(CancellationToken cancellationToken);
}
