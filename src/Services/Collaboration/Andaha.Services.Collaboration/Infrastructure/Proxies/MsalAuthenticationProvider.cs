using Microsoft.Extensions.Options;
using Microsoft.Graph;
using Microsoft.Identity.Client;
using System.Net.Http.Headers;

namespace Andaha.Services.Collaboration.Infrastructure.Proxies;

internal class MsalAuthenticationProvider : IAuthenticationProvider
{
    private readonly IConfidentialClientApplication clientApplication;
    private readonly string[] scopes;

    public MsalAuthenticationProvider(IOptions<AzureAdB2CGraphApiConfiguration> options)
    {
        if (options?.Value is null)
        {
            throw new ArgumentNullException(nameof(options));
        }

        string authority = $"https://login.microsoftonline.com/{options.Value.TenantId}/v2.0";
        
        scopes = new[] { "https://graph.microsoft.com/.default" };

        clientApplication = ConfidentialClientApplicationBuilder
           .Create(options.Value.ClientId)
           .WithAuthority(authority)
           .WithClientSecret(options.Value.ClientSecret)
           .Build();
    }

    public async Task AuthenticateRequestAsync(HttpRequestMessage request)
    {
        var token = await clientApplication.AcquireTokenForClient(scopes).ExecuteAsync();

        request.Headers.Authorization = new AuthenticationHeaderValue("bearer", token.AccessToken);
    }
}
