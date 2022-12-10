using Andaha.CrossCutting.Application.Result;
using Dapr.Client;
using Microsoft.Extensions.Options;

namespace Andaha.Services.Collaboration.Infrastructure.Proxies;

public class IdentityApiProxy : IIdentityApiProxy
{
    private readonly DaprClient daprClient;
    private readonly DaprConfiguration daprConfiguration;

    public IdentityApiProxy(
        DaprClient daprClient,
        IOptions<DaprConfiguration> daprConfiguration)
    {
        this.daprClient = daprClient ?? throw new ArgumentNullException(nameof(daprClient));
        this.daprConfiguration = daprConfiguration?.Value ?? throw new ArgumentNullException(nameof(daprConfiguration));
    }

    public async Task<Result<GetUserResponse>> GetUserByEmailAsync(string emailAddress, CancellationToken cancellationToken)
    {
        try
        {
            var request = GetRequestMessage($"/api/user/{emailAddress}");

            return await this.daprClient.InvokeMethodAsync<GetUserResponse>(request, cancellationToken);
        }
        catch (InvocationException ex) when (ex.Response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return Result<GetUserResponse>.NotFound();
        }
    }

    private HttpRequestMessage GetRequestMessage(string requestUrl)
    {
        return this.daprClient.CreateInvokeMethodRequest(HttpMethod.Get, this.daprConfiguration.IdentityAppId, requestUrl);
    }
}
