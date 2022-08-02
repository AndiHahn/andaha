using Andaha.ApiGateways.Ocelot;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder
    .AddCustomOcelot();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseOcelot().Wait();

app.MapControllers();

/*
app.MapHealthChecks("/hc", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/liveness", new HealthCheckOptions
{
    Predicate = r => r.Name.Contains("self")
});
*/

app.Run();
