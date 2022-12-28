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

app.MapHealthChecks();

app.MapBudgetPlanEndpoints();

await Task.Delay(10);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(
        options =>
        {
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

try
{
    await app.MigrateBudgetPlanDatabaseAsync(app.Logger);

    app.Run();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Host terminated unexpectedly.");
}

