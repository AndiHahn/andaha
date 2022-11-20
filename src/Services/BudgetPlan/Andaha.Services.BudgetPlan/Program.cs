using Andaha.Services.BudgetPlan;

var builder = WebApplication.CreateBuilder(args);

builder
    .AddCustomDatabase()
    .AddCustomApplicationServices()
    .AddCustomAuthentication()
    .AddCustomHealthChecks()
    .AddCustomApiVersioning()
    .AddCustomSwagger()
    .AddCustomCors()
    .AddCustomDapr()
    .AddCustomLogging();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapEndpoints();

await Task.Delay(10);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(
        options =>
        {
            options.OAuthClientId("budgetplanswaggerui");

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
    await app.MigrateDatabaseAsync(app.Logger);

    app.Run();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Host terminated unexpectedly.");
}

