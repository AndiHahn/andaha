using Andaha.Services.Shopping;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers().AddDapr();

builder
    .AddCustomDatabase()
    .AddCustomDapr()
    .AddCustomLogging()
    .AddCustomApplicationServices()
    .AddCustomApiVersioning()
    .AddCustomAuthentication()
    .AddCustomHealthChecks()
    .AddCustomSwagger()
    .AddCustomCors();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapHealthChecks();

app.MapShoppingEndpoints();

await Task.Delay(10);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(
        options =>
        {
            options.OAuthClientId("shoppingswaggerui");

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

try
{
    await app.MigrateShoppingDatabaseAsync(app.Logger);
    
    app.Run();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Host terminated unexpectedly.");
}
