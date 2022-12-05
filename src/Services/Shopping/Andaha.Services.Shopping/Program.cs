using Andaha.Services.Shopping;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc.ApiExplorer;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers().AddDapr();

builder
    .AddCustomDatabase()
    .AddCustomApplicationServices()
    .AddCustomApiVersioning()
    .AddCustomAuthentication()
    .AddCustomHealthChecks()
    .AddCustomSwagger()
    .AddCustomCors();

builder.Services.AddDaprClient();

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

app.UseCloudEvents();

app.UseCors();

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

app.MapGet("/api/ping", Results.NoContent);

try
{
    await app.MigrateShoppingDatabaseAsync(app.Logger);
    
    app.Run();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Host terminated unexpectedly.");
}
