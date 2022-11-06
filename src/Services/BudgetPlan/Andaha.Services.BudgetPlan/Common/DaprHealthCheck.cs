using Dapr.Client;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Andaha.Services.BudgetPlan.Common;

internal class DaprHealthCheck : IHealthCheck
{
    private readonly DaprClient daprClient;

    public DaprHealthCheck(DaprClient daprClient)
    {
        this.daprClient = daprClient;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var healthy = await daprClient.CheckHealthAsync(cancellationToken);

        if (healthy)
        {
            return HealthCheckResult.Healthy("Dapr sidecar is healthy.");
        }

        return new HealthCheckResult(
            context.Registration.FailureStatus,
            "Dapr sidecar is unhealthy.");
    }
}
