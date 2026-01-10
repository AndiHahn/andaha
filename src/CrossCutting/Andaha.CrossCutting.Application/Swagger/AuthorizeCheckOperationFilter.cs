using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Andaha.CrossCutting.Application.Swagger;

public class AuthorizeCheckOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Policy names map to scopes
        var requiredScopes = context.MethodInfo
            .GetCustomAttributes(true)
            .OfType<AuthorizeAttribute>()
            .Select(attribute => attribute.Policy!)
            .Distinct()
            .ToList();

        if (requiredScopes.Count > 0)
        {
            operation.Responses ??= [];
            operation.Responses.TryAdd("401", new OpenApiResponse { Description = "Unauthorized" });
            operation.Responses.TryAdd("403", new OpenApiResponse { Description = "Forbidden" });

            var scheme = new OpenApiSecuritySchemeReference("oauth2", context.Document);

            operation.Security =
            [
                new OpenApiSecurityRequirement
                {
                    [scheme] = requiredScopes
                }
            ];
        }
    }
}
