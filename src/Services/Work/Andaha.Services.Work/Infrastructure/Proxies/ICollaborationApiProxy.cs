namespace Andaha.Services.Work.Infrastructure.Proxies;

public interface ICollaborationApiProxy
{
    Task<IReadOnlyCollection<Guid>> GetConnectedUsers(CancellationToken cancellationToken);
}