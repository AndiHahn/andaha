using Andaha.CrossCutting.Application.Swagger;
using Andaha.CrossCutton.Application.Healthcheck;
using Andaha.Services.BudgetPlan.Common;
using Asp.Versioning;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging.ApplicationInsights;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Andaha.Services.Monolith;

internal static class ProgramExtensions
{
    internal static WebApplicationBuilder AddCustomDapr(this WebApplicationBuilder builder)
    {
        builder.Services.AddDaprClient();

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

    internal static WebApplicationBuilder AddCustomLogging(this WebApplicationBuilder builder)
    {
        if (!builder.Environment.IsDevelopment())
        {
            builder.Services.AddApplicationInsightsTelemetry(config =>
            {
                config.EnableAdaptiveSampling = false;
            });
        }

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
                name: "sql-db-check",
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

            string? domain = azureAdB2CConfig.GetValue<string>("Domain");
            string? tenant = azureAdB2CConfig.GetValue<string>("Tenant");
            string? policy = azureAdB2CConfig.GetValue<string>("SignUpSignInPolicyId");
            string? scope = azureAdB2CConfig.GetValue<string>("Scope");
            if (domain is null || tenant is null || policy is null || scope is null)
            {
                throw new InvalidOperationException("AzureAdB2CSwagger parameters must be provieded in appsettings.");
            }

            string authEndpoint = $"https://{domain}/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/authorize";
            string tokenEndpoint = $"https://{domain}/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/token";
            
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
}
