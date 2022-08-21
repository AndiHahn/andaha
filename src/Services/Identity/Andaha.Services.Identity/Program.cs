using Andaha.Services.Identity;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder
    .AddCustomDatabase()
    .AddCustomIdentity()
    .AddCustomIdentityServer()
    .AddCustomAuthentication()
    .AddCustomHealthChecks()
    .AddCustomCors();

// Add services to the container.
builder.Services.AddRazorPages();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseCookiePolicy(new CookiePolicyOptions { MinimumSameSitePolicy = SameSiteMode.Lax });

app.UseRouting();

app.Use((context, next) =>
{
    // If the Application Request Routing (ARR) SSL header is set,
    // set the request type to HTTPS. This ensures that Identity Server
    // uses HTTPS URLs in the configuration exposed by the Discovery Endpoint.
    // Ideally, we'd use the Forwarded Headers middleware for this,
    // but Azure Containers Apps currently sends `http` in the
    // x-forwarded-proto header instead of `https` (even when connecting
    // using https).
    // See https://github.com/microsoft/azure-container-apps/issues/97
    if (context.Request.Headers.TryGetValue("x-arr-ssl", out var ssl) &&
        string.CompareOrdinal(ssl, "true") == 0)
    {
        context.Request.Scheme = "https";
    }

    return next();
});

app.UseCors();

app.UseIdentityServer();

app.UseAuthentication();

app.UseAuthorization();

app.MapRazorPages();

app.MapHealthChecks("/hc", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/liveness", new HealthCheckOptions
{
    Predicate = r => r.Name.Contains("self")
});

app.MapGet("/ping", Results.NoContent);

try
{
    await app.MigrateDatabaseAsync(app.Logger);

    app.Run();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Host terminated unexpectedly.");
}
