using Andaha.ApiGateways.Ocelot;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder
    .AddCustomOcelot();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseOcelot().Wait();

app.MapControllers();

app.Run();
