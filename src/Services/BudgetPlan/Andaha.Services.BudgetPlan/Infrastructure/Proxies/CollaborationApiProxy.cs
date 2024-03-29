﻿using Andaha.Services.BudgetPlan.Infrastructure;
using Dapr.Client;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;

namespace Andaha.Services.Shopping.Infrastructure.Proxies;

internal class CollaborationApiProxy : ICollaborationApiProxy
{
    private readonly DaprClient daprClient;
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly DaprConfiguration daprConfiguration;
    private readonly ILogger<CollaborationApiProxy> logger;

    public CollaborationApiProxy(
        DaprClient daprClient,
        IHttpContextAccessor httpContextAccessor,
        IOptions<DaprConfiguration> daprConfiguration,
        ILogger<CollaborationApiProxy> logger)
    {
        this.daprClient = daprClient ?? throw new ArgumentNullException(nameof(daprClient));
        this.httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        this.daprConfiguration = daprConfiguration?.Value ?? throw new ArgumentNullException(nameof(daprConfiguration));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyCollection<Guid>> GetConnectedUsersAsync(CancellationToken cancellationToken)
    {
        try
        {
            var request = GetRequestMessage("/api/connection/users?api-version=1.0");

            return await this.daprClient.InvokeMethodAsync<IReadOnlyCollection<Guid>>(request, cancellationToken);
        }
        catch (Exception ex)
        {
            this.logger.LogError(ex, "Could not retrieve connected users from shopping api.");

            return new List<Guid>();
        }
    }

    private HttpRequestMessage GetRequestMessage(string requestUrl)
    {
        string bearerToken = GetUserBearerToken();

        var request = this.daprClient.CreateInvokeMethodRequest(HttpMethod.Get, this.daprConfiguration.CollaborationAppId, requestUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

        return request;
    }

    private string GetUserBearerToken()
    {
        var authHeader = this.httpContextAccessor?.HttpContext?.Request.Headers.Authorization.First();
        if (authHeader is null)
        {
            throw new InvalidOperationException("User is not authenticated.");
        }

        return authHeader.Substring("Bearer ".Length).Trim();
    }
}
