using Andaha.CrossCutting.Application.Result;

namespace Andaha.Services.Collaboration.Infrastructure.Proxies;
public interface IIdentityApiProxy
{
    Task<Result<GetUserResponse>> GetUserByEmailAsync(string emailAddress, CancellationToken cancellationToken);
}