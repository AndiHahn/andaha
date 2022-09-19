using Andaha.Services.Identity.Domain;
using Andaha.Services.Identity.Infrastructure;
using Azure.Identity;
using Azure.Security.KeyVault.Certificates;
using Duende.IdentityServer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Polly;

namespace Andaha.Services.Identity;

internal static class ProgramExtensions
{
    internal static WebApplicationBuilder AddCustom(this WebApplicationBuilder builder)
    {

        return builder;
    }

    internal static WebApplicationBuilder AddCustomDatabase(this WebApplicationBuilder builder)
    {
        builder.Services.AddDbContext<ApplicationDbContext>(
            options => options.UseSqlServer(builder.Configuration.GetConnectionString("ApplicationDbConnection")));

        return builder;
    }
    

    internal static WebApplicationBuilder AddCustomIdentity(this WebApplicationBuilder builder)
    {
        builder.Services
            .AddIdentity<ApplicationUser, IdentityRole>(options => options.SignIn.RequireConfirmedAccount = true)
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        return builder;
    }

    internal static WebApplicationBuilder AddCustomIdentityServer(this WebApplicationBuilder builder)
    {
        var identityServerBuilder = builder.Services.AddIdentityServer(
                options =>
                {
                    options.IssuerUri = builder.Configuration["IssuerUrl"];
                    options.Authentication.CookieLifetime = TimeSpan.FromDays(30);

                    options.EmitStaticAudienceClaim = true;

                    options.Events.RaiseErrorEvents = true;
                    options.Events.RaiseInformationEvents = true;
                    options.Events.RaiseFailureEvents = true;
                    options.Events.RaiseSuccessEvents = true;
                })
            .AddInMemoryIdentityResources(Config.IdentityResources)
            .AddInMemoryApiScopes(Config.ApiScopes)
            .AddInMemoryApiResources(Config.ApiResources)
            .AddInMemoryClients(Config.GetClients(builder.Configuration))
            .AddAspNetIdentity<ApplicationUser>();

        if (builder.Environment.IsDevelopment())
        {
            identityServerBuilder.AddDeveloperSigningCredential();
        }
        else
        {
            var certificateClient = new CertificateClient(
                new Uri(builder.Configuration.GetSection("Certificate").GetValue<string>("KeyVaultUri")),
                new DefaultAzureCredential(new DefaultAzureCredentialOptions
                {
                    ExcludeAzureCliCredential = true,
                    ExcludeEnvironmentCredential = true,
                    ExcludeInteractiveBrowserCredential = true,
                    ExcludeSharedTokenCacheCredential = true,
                    ExcludeVisualStudioCodeCredential = true,
                    ExcludeVisualStudioCredential = true,
                    ExcludeManagedIdentityCredential = false,
                }),
                new CertificateClientOptions
                {
                    Retry =
                    {
                        Delay = TimeSpan.FromSeconds(3),
                        MaxDelay = TimeSpan.FromSeconds(10),
                        MaxRetries = 5,
                        Mode = Azure.Core.RetryMode.Exponential
                    }
                });

            var certificate = certificateClient.DownloadCertificate(
                builder.Configuration.GetSection("Certificate").GetValue<string>("CertificateName"));

            identityServerBuilder.AddSigningCredential(certificate);
        }

        return builder;
    }

    internal static WebApplicationBuilder AddCustomAuthentication(this WebApplicationBuilder builder)
    {
        var facebookAuthSection = builder.Configuration.GetSection("Authentication").GetSection("Facebook");

        builder.Services
            .AddAuthentication()
            .AddFacebook("Facebook", options =>
            {
                options.SignInScheme = IdentityServerConstants.ExternalCookieAuthenticationScheme;

                options.AppId = facebookAuthSection.GetValue<string>("AppId");
                options.AppSecret = facebookAuthSection.GetValue<string>("AppSecret");
            });

        return builder;
    }

    internal static WebApplicationBuilder AddCustomHealthChecks(this WebApplicationBuilder builder)
    {
        builder.Services
            .AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy())
            .AddSqlServer(builder.Configuration.GetConnectionString("ApplicationDbConnection"),
                name: "identity-db-check",
                tags: new [] { "sql-db" });

        return builder;
    }

    internal static WebApplicationBuilder AddCustomCors(this WebApplicationBuilder builder)
    {
        builder.Services.AddCors(
            options =>
            {
                options.AddDefaultPolicy(
                    policyBuilder =>
                    {
                        policyBuilder
                            .AllowAnyOrigin()
                            .AllowAnyHeader()
                            .AllowAnyMethod();
                    });
            });

        return builder;
    }

    internal static async Task MigrateDatabaseAsync(this WebApplication webApplication, ILogger logger)
    {
        using var scope = webApplication.Services.CreateScope();

        var retryPolicy = CreateRetryPolicy(logger);

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await retryPolicy.ExecuteAsync(async () =>
        {
            await dbContext.Database.MigrateAsync();
            await ApplicationDbContextSeed.SeedAsync(userManager);
        });
    }

    private static AsyncPolicy CreateRetryPolicy(ILogger logger)
    {
        return Policy.Handle<Exception>()
            .WaitAndRetryForeverAsync(
                sleepDurationProvider: _ => TimeSpan.FromSeconds(5),
                onRetry: (exception, retry, _) =>
                {
                    logger.LogWarning(
                        exception,
                        "Exception {ExceptionType} with message {Message} detected during database migration (retry attempt {retry})",
                        exception.GetType().Name,
                        exception.Message,
                        retry);
                }
            );
    }
}
