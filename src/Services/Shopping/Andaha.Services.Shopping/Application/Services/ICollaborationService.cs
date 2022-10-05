namespace Andaha.Services.Shopping.Application.Services;

internal interface ICollaborationService
{
    Task SetConnectedUsersAsync(CancellationToken cancellationToken);
}