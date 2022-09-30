namespace Andaha.Services.Shopping.Infrastructure.Proxies;

public interface ICollaborationApiProxy
{
    Task<IReadOnlyCollection<Guid>> GetConnectedUsers(CancellationToken cancellationToken);
}