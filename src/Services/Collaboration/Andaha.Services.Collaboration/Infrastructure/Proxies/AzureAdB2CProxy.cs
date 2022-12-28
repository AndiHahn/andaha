using Andaha.CrossCutting.Application.Result;
using Microsoft.Graph;

namespace Andaha.Services.Collaboration.Infrastructure.Proxies;

internal class AzureAdB2CProxy : IIdentityApiProxy
{
    private readonly GraphServiceClient graphServiceClient;

    public AzureAdB2CProxy(
        IAuthenticationProvider authenticationProvider)
    {
        this.graphServiceClient = new GraphServiceClient(authenticationProvider);
    }

    public async Task<Result<GetUserResponse>> GetUserByEmailAsync(string emailAddress, CancellationToken cancellationToken)
    {
        var allUsers = await this.graphServiceClient
            .Users
            .Request()
            .Select(user => new
            {
                user.Id,
                user.DisplayName,
                user.OtherMails,
            })
            .GetAsync(cancellationToken);

        var user = allUsers.FirstOrDefault(user => user.OtherMails.Any(mail => mail == emailAddress));
        if (user is null)
        {
            return Result<GetUserResponse>.NotFound();
        }

        return Result<GetUserResponse>.Success(new GetUserResponse(new Guid(user.Id), user.DisplayName, user.OtherMails.First()));
    }
}
