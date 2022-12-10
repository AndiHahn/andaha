using Duende.IdentityServer;
using Duende.IdentityServer.Models;
using IdentityModel;
using static System.Formats.Asn1.AsnWriter;

namespace Andaha.Services.Identity;

internal static class Config
{
    public static IEnumerable<IdentityResource> IdentityResources =>
        new IdentityResource[]
        {
            new IdentityResources.OpenId(),
            new IdentityResources.Profile(),
            new IdentityResources.Email()
        };

    public static IEnumerable<ApiScope> ApiScopes =>
        new ApiScope[]
        {
            new("shopping", "Access to Shopping API"),
            new("collaboration", "Access to Collaboration API"),
            new("budgetplan", "Access to Budgetplan API"),
            new("monolith", "Access to all APIs")
        };

    public static IEnumerable<ApiResource> ApiResources =>
        new ApiResource[]
        {
            new("shopping-api", "Shopping API", new List<string> { JwtClaimTypes.Email, JwtClaimTypes.Name })
            {
                Scopes = { "shopping" }
            },
            new("collaboration-api", "Collaboration API", new List<string> { JwtClaimTypes.Email, JwtClaimTypes.Name })
            {
                Scopes = { "collaboration" }
            },
            new("budgetplan-api", "Budgetplan API", new List<string> { JwtClaimTypes.Email, JwtClaimTypes.Name })
            {
                Scopes = { "budgetplan" }
            },
            new("monolith-api", "Monolith API", new List<string> { JwtClaimTypes.Email, JwtClaimTypes.Name })
            {
                Scopes = { "monolith" }
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
                ClientId = "collaborationswaggerui",
                ClientName = "Collaboration Swagger UI",
                AllowedGrantTypes = GrantTypes.Implicit,
                AllowAccessTokensViaBrowser = true,

                RedirectUris =
                {
                    $"{configuration["ExternalUrls:CollaborationApi"]}/swagger/oauth2-redirect.html"
                },
                PostLogoutRedirectUris =
                {
                    $"{configuration["ExternalUrls:CollaborationApi"]}/swagger/"
                },

                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "collaboration"
                }
            },
            new()
            {
                ClientId = "budgetplanswaggerui",
                ClientName = "Budgetplan Swagger UI",
                AllowedGrantTypes = GrantTypes.Implicit,
                AllowAccessTokensViaBrowser = true,

                RedirectUris =
                {
                    $"{configuration["ExternalUrls:BudgetplanApi"]}/swagger/oauth2-redirect.html"
                },
                PostLogoutRedirectUris =
                {
                    $"{configuration["ExternalUrls:BudgetplanApi"]}/swagger/"
                },

                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "budgetplan"
                }
            },
            new()
            {
                ClientId = "monolithswaggerui",
                ClientName = "Monolith Swagger UI",
                AllowedGrantTypes = GrantTypes.Implicit,
                AllowAccessTokensViaBrowser = true,

                RedirectUris =
                {
                    $"{configuration["ExternalUrls:MonolithApi"]}/swagger/oauth2-redirect.html"
                },
                PostLogoutRedirectUris =
                {
                    $"{configuration["ExternalUrls:MonolithApi"]}/swagger/"
                },

                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "monolith"
                }
            },
            new()
            {
                ClientId = "miniclient",
                ClientName = "Webapp Mini Client",
                AllowedGrantTypes = GrantTypes.Code,
                AllowAccessTokensViaBrowser = true,
                RequirePkce = true,
                RequireClientSecret = false,
                AllowOfflineAccess = true,

                AllowedCorsOrigins =
                {
                    $"{configuration["ExternalUrls:WebMiniClient"]}"
                },

                RedirectUris =
                {
                    $"{configuration["ExternalUrls:WebMiniClient"]}",
                    $"{configuration["ExternalUrls:WebMiniClient"]}/signin-oidc"
                },
                PostLogoutRedirectUris =
                {
                    $"{configuration["ExternalUrls:WebMiniClient"]}",
                    $"{configuration["ExternalUrls:WebMiniClient"]}/signout-callback-oidc"
                },

                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    IdentityServerConstants.StandardScopes.OfflineAccess,
                    IdentityServerConstants.StandardScopes.Email,
                    "shopping",
                    "collaboration",
                    "budgetplan",
                    "monolith"
                },
                AccessTokenLifetime = 60 * 60 * 24 * 30 // 60 * 60 * 24 * 30 = 1 month
            }
        };
    }
}
