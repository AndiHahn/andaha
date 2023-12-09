using Andaha.Services.BudgetPlan;
using Andaha.Services.Collaboration;
using Andaha.Services.Monolith;
using Andaha.Services.Shopping;
using Andaha.Services.Work;

var builder = WebApplication.CreateBuilder(args);

builder
    .AddCustomDapr()
    .AddCustomCors()
    .AddCustomLogging()
    .AddCustomHealthChecks()
    .AddCustomAuthentication()
    .AddCustomApiVersioning()
    .AddCustomSwagger();

builder
    .AddCollaborationServices()
    .AddBudgetPlanServices()
    .AddShoppingServices()
    .AddWorkServices();

var app = builder.Build();

await Task.Delay(10);

// Configure the HTTP request pipeline.
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

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapHealthChecks();

app.MapMonolithEndpoints();

app.MapControllers();

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Add("Access-Control-Expose-Headers", "*");

    await next();
});

await app.MigrateBudgetPlanDatabaseAsync(app.Logger);
await app.MigrateCollaborationDatabaseAsync(app.Logger);
await app.MigrateShoppingDatabaseAsync(app.Logger);
await app.MigrateWorkDatabaseAsync(app.Logger);

app.Run();
