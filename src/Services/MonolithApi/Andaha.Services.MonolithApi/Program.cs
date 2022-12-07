using Andaha.Services.BudgetPlan;
using Andaha.Services.Collaboration;
using Andaha.Services.MonolithApi;
using Andaha.Services.Shopping;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

builder
    .AddCustomDapr()
    .AddCustomCors()
    .AddCustomLogging()
    .AddCustomAuthentication()
    .AddCustomApiVersioning()
    .AddCustomSwagger();

builder
    .AddCollaborationServices()
    .AddBudgetPlanServices()
    .AddShoppingServices();

var app = builder.Build();

await Task.Delay(10);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(
        options =>
        {
            options.OAuthClientId("monolithswaggerui");

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

app
    .MapBudgetPlanEndpoints()
    .MapCollaborationEndpoints()
    .MapShoppingEndpoints();

app.MapControllers();

await app.MigrateBudgetPlanDatabaseAsync(app.Logger);
await app.MigrateCollaborationDatabaseAsync(app.Logger);
await app.MigrateShoppingDatabaseAsync(app.Logger);

app.Run();
