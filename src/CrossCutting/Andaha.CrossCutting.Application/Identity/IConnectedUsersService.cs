namespace Andaha.CrossCutting.Application.Identity;

public interface IConnectedUsersService
{
    IReadOnlyCollection<Guid> GetConnectedUserIds();
    void SetConnectedUsers(IReadOnlyCollection<Guid> connectedUsers);
}