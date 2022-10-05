using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure.Proxies;

namespace Andaha.Services.Shopping.Application.Services;

internal class CollaborationService : ICollaborationService
{
    private readonly IConnectedUsersService connectedUsersService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public CollaborationService(
        IConnectedUsersService connectedUsersService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.connectedUsersService = connectedUsersService ?? throw new ArgumentNullException(nameof(connectedUsersService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task SetConnectedUsersAsync(CancellationToken cancellationToken)
    {
        var connectedUserIds = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        if (connectedUserIds is null)
        {
            throw new InvalidOperationException("Could not retrieve connected users.");
        }

        this.connectedUsersService.SetConnectedUsers(connectedUserIds);
    }
}
