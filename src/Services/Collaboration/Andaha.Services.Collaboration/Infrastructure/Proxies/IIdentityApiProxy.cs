using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Collaboration.Dtos;

namespace Andaha.Services.Collaboration.Infrastructure.Proxies;
public interface IIdentityApiProxy
{
    Task<Result<GetUserResponse>> GetUserByEmailAsync(string emailAddress, CancellationToken cancellationToken);
}