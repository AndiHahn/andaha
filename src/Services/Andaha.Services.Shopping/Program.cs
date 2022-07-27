using Andaha.Services.Shopping;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc.ApiExplorer;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

builder
    .AddCustomDatabase()
    .AddCustomApplicationServices()
    .AddCustomApiVersioning()
    .AddCustomAuthentication()
    .AddCustomHealthChecks()
    .AddCustomSwagger();

builder.Services.AddLogging();

var app = builder.Build();

var versionProvider = app.Services.GetRequiredService<IApiVersionDescriptionProvider>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(
        options =>
        {
            options.OAuthClientId("shoppingswaggerui");

            foreach (var version in versionProvider.ApiVersionDescriptions.Select(description => description.GroupName))
            {
                options.SwaggerEndpoint($"/swagger/{version}/swagger.json", version.ToUpperInvariant());
            }
        });
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/hc", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/liveness", new HealthCheckOptions
{
    Predicate = r => r.Name.Contains("self")
});

try
{
    await app.MigrateAndSeedDatabaseAsync(app.Logger);
    
    app.Run();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Host terminated unexpectedly.");
}
