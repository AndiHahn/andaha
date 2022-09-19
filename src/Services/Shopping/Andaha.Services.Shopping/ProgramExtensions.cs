using Andaha.CrossCutting.Application;
using Andaha.Services.Shopping.Filter;
using Andaha.Services.Shopping.Healthcheck;
using Andaha.Services.Shopping.Infrastructure;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using Polly;
using System.Reflection;

namespace Andaha.Services.Shopping;

internal static class ProgramExtensions
{
    internal static WebApplicationBuilder AddCustomDatabase(this WebApplicationBuilder builder)
    {
        builder.Services.AddDbContext<ShoppingDbContext>(options
            => options.UseSqlServer(builder.Configuration.GetConnectionString("ApplicationDbConnection")));

        return builder;
    }

    internal static WebApplicationBuilder AddCustomApplicationServices(this WebApplicationBuilder builder)
    {
        builder.Services.AddCqrs(Assembly.GetExecutingAssembly());
        builder.Services.AddIdentityService();

        return builder;
    }

    internal static WebApplicationBuilder AddCustomApiVersioning(this WebApplicationBuilder builder)
    {
        builder.Services.AddApiVersioning(
            options =>
            {
                options.ReportApiVersions = true;
                options.ApiVersionReader = new QueryStringApiVersionReader("api-version");
            });

        return builder;
    }

    internal static WebApplicationBuilder AddCustomAuthentication(this WebApplicationBuilder builder)
    {
        // Prevent mapping "sub" claim to nameidentifier.
        //JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Remove("sub");

        var identityApiBaseUrl = builder.Configuration.GetSection("ExternalUrls").GetValue<string>("IdentityApi");

        builder.Services
            .AddAuthentication("Bearer")
            .AddJwtBearer(
                options =>
                {
                    options.Audience = "shopping-api";
                    options.Authority = identityApiBaseUrl;
                    options.RequireHttpsMetadata = false;
                });

        return builder;
    }

    internal static WebApplicationBuilder AddCustomHealthChecks(this WebApplicationBuilder builder)
    {
        builder.Services
            .AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy())
            .AddCheck<DaprHealthCheck>("dapr")
            .AddSqlServer(
                builder.Configuration["ConnectionStrings:ApplicationDbConnection"],
                name: "shopping-db-check",
                tags: new[] { "sql-db" });

        return builder;
    }

    internal static WebApplicationBuilder AddCustomSwagger(this WebApplicationBuilder builder)
    {
        builder.Services.AddVersionedApiExplorer(options => options.GroupNameFormat = "'v'VVV");

        builder.Services.AddSwaggerGen(config =>
        {
            config.SupportNonNullableReferenceTypes();

            var identityApiBaseUrl = builder.Configuration.GetSection("ExternalUrls").GetValue<string>("IdentityApi");

            config.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.OAuth2,
                Flows = new OpenApiOAuthFlows()
                {
                    Implicit = new OpenApiOAuthFlow()
                    {
                        AuthorizationUrl = new Uri($"{identityApiBaseUrl}/connect/authorize"),
                        TokenUrl = new Uri($"{identityApiBaseUrl}/connect/token"),
                        Scopes = new Dictionary<string, string>()
                        {
                            { "shopping" , "Shopping API" }
                        }
                    }
                }
            });

            config.OperationFilter<AuthorizeCheckOperationFilter>();
        });

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

    internal static async Task MigrateAndSeedDatabaseAsync(this WebApplication webApplication, ILogger logger)
    {
        using var scope = webApplication.Services.CreateScope();

        var retryPolicy = CreateRetryPolicy(logger);

        var dbContext = scope.ServiceProvider.GetRequiredService<ShoppingDbContext>();

        await retryPolicy.ExecuteAsync(async () =>
        {
            await dbContext.Database.MigrateAsync();
            await ShoppingDbContextSeed.SeedAsync(dbContext);
        });
    }

    private static AsyncPolicy CreateRetryPolicy(ILogger logger)
    {
        return Policy.Handle<Exception>()
            .WaitAndRetryForeverAsync(
                sleepDurationProvider: retry => TimeSpan.FromSeconds(5),
                onRetry: (exception, retry, timeSpan) =>
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
