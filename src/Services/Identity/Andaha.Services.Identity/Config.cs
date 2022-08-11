using Duende.IdentityServer;
using Duende.IdentityServer.Models;

namespace Andaha.Services.Identity;

internal static class Config
{
    public static IEnumerable<IdentityResource> IdentityResources =>
        new IdentityResource[]
        {
            new IdentityResources.OpenId(),
            new IdentityResources.Profile()
        };

    public static IEnumerable<ApiScope> ApiScopes =>
        new ApiScope[]
        {
            new ("shopping", "Access to Shopping API")
        };

    public static IEnumerable<ApiResource> ApiResources =>
        new ApiResource[]
        {
            new ("shopping-api", "Shopping API")
            {
                Scopes = { "shopping" }
            }
        };

    public static IEnumerable<Client> GetClients(IConfiguration configuration)
    {
        return new List<Client>
        {
            new()
            {
                ClientId = "shoppingswaggerui",
                ClientName = "Shopping Swagger UI",
                AllowedGrantTypes = GrantTypes.Implicit,
                AllowAccessTokensViaBrowser = true,

                RedirectUris =
                {
                    $"{configuration["ExternalUrls:ShoppingApi"]}/swagger/oauth2-redirect.html"
                },
                PostLogoutRedirectUris =
                {
                    $"{configuration["ExternalUrls:ShoppingApi"]}/swagger/"
                },

                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "shopping"
                }
            },
            new()
            {
                ClientId = "miniclient",
                ClientName = "Webapp Mini Client",
                AllowedGrantTypes = GrantTypes.Implicit,
                AllowAccessTokensViaBrowser = true,

                RedirectUris =
                {
                    $"{configuration["ExternalUrls:WebMiniClient"]}"
                },
                PostLogoutRedirectUris =
                {
                    $"{configuration["ExternalUrls:WebMiniClient"]}"
                },

                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "shopping"
                },
                AccessTokenLifetime = 60 * 60 * 720 // 1 month
            }
        };
    }
}
