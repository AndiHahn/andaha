using Andaha.Services.Collaboration;
using Google.Protobuf.WellKnownTypes;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder
    .AddCustomDatabase()
    .AddCustomApplicationServices()
    .AddCustomAuthentication()
    .AddCustomHealthChecks()
    .AddCustomSwagger()
    .AddCustomCors()
    .AddCustomDapr()
    .AddCustomLogging();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options => {
        string? clientId = builder.Configuration.GetSection("Authentication").GetSection("AzureAdB2CSwagger").GetValue<string>("ClientId");
        if (clientId is null)
        {
            throw new InvalidOperationException("Swagger ClientId for AzureAdB2C authentication is not set in appsettings.");
        }

        options.OAuthClientId(clientId);

        var descriptions = app.DescribeApiVersions();

        // build a swagger endpoint for each discovered API version
        foreach (var description in descriptions)
        {
            var url = $"/swagger/{description.GroupName}/swagger.json";
            var name = description.GroupName.ToUpperInvariant();
            options.SwaggerEndpoint(url, name);
        }
    });
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapHealthChecks();

app.MapCollaborationEndpoints();

try
{
    await app.MigrateCollaborationDatabaseAsync(app.Logger);

    app.Run();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Host terminated unexpectedly.");
}
