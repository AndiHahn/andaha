using Andaha.Services.Collaboration;

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
    app.UseSwaggerUI(setup => setup.OAuthClientId("collaborationswaggerui"));
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
