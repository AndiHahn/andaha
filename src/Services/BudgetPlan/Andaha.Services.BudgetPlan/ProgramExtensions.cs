using Andaha.CrossCutting.Application;
using Andaha.CrossCutting.Application.Swagger;
using Andaha.CrossCutton.Application.Healthcheck;
using Andaha.Services.BudgetPlan.Common;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Asp.Versioning;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using Polly;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;

namespace Andaha.Services.BudgetPlan;

public static class ProgramExtensions
{
    public static WebApplicationBuilder AddBudgetPlanServices(this WebApplicationBuilder builder)
    {
        return builder
            .AddCustomDatabase()
            .AddCustomApplicationServices();
    }

    internal static WebApplicationBuilder AddCustomDapr(this WebApplicationBuilder builder)
    {
        builder.Services.AddDaprClient();

        return builder;
    }

    internal static WebApplicationBuilder AddCustomLogging(this WebApplicationBuilder builder)
    {
        builder.Services.AddLogging();

        return builder;
    }

    internal static WebApplicationBuilder AddCustomDatabase(this WebApplicationBuilder builder)
    {
        builder.Services.AddDbContext<BudgetPlanDbContext>(options
            => options.UseSqlServer(builder.Configuration.GetConnectionString("ApplicationDbConnection")));
        
        return builder;
    }

    internal static WebApplicationBuilder AddCustomApplicationServices(this WebApplicationBuilder builder)
    {
        builder.Services.AddCqrs(Assembly.GetExecutingAssembly());
        builder.Services.AddIdentityServices();

        builder.Services.Configure<DaprConfiguration>(builder.Configuration.GetSection("Dapr"));

        builder.Services.AddScoped<ICollaborationApiProxy, CollaborationApiProxy>();

        return builder;
    }

    internal static WebApplicationBuilder AddCustomAuthentication(this WebApplicationBuilder builder)
    {
        // Prevent mapping "sub" claim to nameidentifier.
        //JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Remove("sub");

        builder.Services
            .AddAuthentication("Bearer")
            .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("Authentication").GetSection("AzureAdB2C"));

        builder.Services.AddAuthorization();

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
                name: "budgetplan-db-check",
                tags: new[] { "sql-db" });

        return builder;
    }

    internal static WebApplicationBuilder AddCustomApiVersioning(this WebApplicationBuilder builder)
    {
        builder.Services
            .AddEndpointsApiExplorer()
            .AddApiVersioning(
                options =>
                {
                    options.ReportApiVersions = true;
                    options.ApiVersionReader = new QueryStringApiVersionReader("api-version");
                })
            .AddApiExplorer(
                options =>
                {
                    options.GroupNameFormat = "'v'VVV";
                })
            .EnableApiVersionBinding();

        return builder;
    }

    internal static WebApplicationBuilder AddCustomSwagger(this WebApplicationBuilder builder)
    {
        builder.Services.AddTransient<IConfigureOptions<SwaggerGenOptions>, ConfigureSwaggerOptions>();

        builder.Services.AddSwaggerGen(config =>
        {
            config.SupportNonNullableReferenceTypes();

            config.CustomSchemaIds(type => type.ToString());

            var azureAdB2CConfig = builder.Configuration.GetSection("Authentication").GetSection("AzureAdB2CSwagger");

            string? tenant = azureAdB2CConfig.GetValue<string>("Tenant");
            string? policy = azureAdB2CConfig.GetValue<string>("SignUpSignInPolicyId");
            string? scope = azureAdB2CConfig.GetValue<string>("Scope");
            if (tenant is null || policy is null || scope is null)
            {
                throw new InvalidOperationException("AzureAdB2CSwagger parameters must be provieded in appsettings.");
            }

            string authEndpoint = $"https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/authorize";
            string tokenEndpoint = $"https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/token";

            config.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.OAuth2,
                Flows = new OpenApiOAuthFlows()
                {
                    Implicit = new OpenApiOAuthFlow()
                    {
                        AuthorizationUrl = new Uri(authEndpoint),
                        TokenUrl = new Uri(tokenEndpoint),
                        Scopes = new Dictionary<string, string>()
                        {
                            { scope, "Required scopes" },
                        }
                    }
                }
            });

            config.OperationFilter<AuthorizeCheckOperationFilter>();

            config.OperationFilter<SwaggerDefaultValues>();

            config.SchemaFilter<SmartEnumSchemaFilter>();
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

    public static async Task MigrateBudgetPlanDatabaseAsync(this WebApplication webApplication, ILogger logger)
    {
        using var scope = webApplication.Services.CreateScope();

        var retryPolicy = CreateRetryPolicy(logger);

        var dbContext = scope.ServiceProvider.GetRequiredService<BudgetPlanDbContext>();

        await retryPolicy.ExecuteAsync(async () =>
        {
            await dbContext.Database.MigrateAsync();
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
