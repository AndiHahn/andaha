namespace Andaha.CrossCutting.Application.Identity;
internal class ConnectedUsersService : IConnectedUsersService
{
    private IReadOnlyCollection<Guid>? connectedUserIds;

    public IReadOnlyCollection<Guid> GetConnectedUserIds() =>
        this.connectedUserIds ?? throw new InvalidOperationException("Connected users have not been set.");

    public void SetConnectedUsers(IReadOnlyCollection<Guid> connectedUsers) =>
        this.connectedUserIds = connectedUsers;
}
