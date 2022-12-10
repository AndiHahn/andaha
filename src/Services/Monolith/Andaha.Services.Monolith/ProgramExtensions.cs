using Andaha.CrossCutting.Application.Swagger;
using Andaha.CrossCutton.Application.Healthcheck;
using Andaha.Services.BudgetPlan.Common;
using Asp.Versioning;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
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
        builder.Services.AddLogging();

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
                    options.Audience = "monolith-api";
                    options.Authority = identityApiBaseUrl;
                    options.RequireHttpsMetadata = false;
                });

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
                            { "monolith" , "Monolith API" }
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
