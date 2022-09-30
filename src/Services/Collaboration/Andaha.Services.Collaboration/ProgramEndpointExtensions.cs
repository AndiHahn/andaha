using Andaha.Services.Collaboration.Extensions;
using Andaha.Services.Collaboration.Requests.AcceptConnectionRequest;
using Andaha.Services.Collaboration.Requests.DeclineConnectionRequest;
using Andaha.Services.Collaboration.Requests.GetConnectedUserIds;
using Andaha.Services.Collaboration.Requests.ListConnectedAccounts;
using Andaha.Services.Collaboration.Requests.ListConnectionRequests;
using Andaha.Services.Collaboration.Requests.ListIncomingConnectionRequests;
using Andaha.Services.Collaboration.Requests.RequestAccountConnection;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace Andaha.Services.Collaboration;

public static class ProgramEndpointExtensions
{
    internal static WebApplication MapEndpoints(this WebApplication app)
    {
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

        app.MediatePost<RequestAccountConnectionRequest>("/api/connection/request");

        app.MediateGet<ListOutgoingConnectionRequestsRequest>("/api/connection/outgoing");

        app.MediateGet<ListIncomingConnectionRequestsRequest>("/api/connection/incoming");

        app.MediatePut<AcceptConnectionRequestRequest>("/api/connection/accept/{fromUserId}");

        app.MediateDelete<DeclineConnectionRequestRequest>("/api/connection/decline/{fromUserId}");

        app.MediateGet<ListConnectedAccountsRequest>("/api/connection/established");

        app.MediateGet<GetConnectedUserIdsRequest>("/api/connection/users");

        return app;
    }
}
