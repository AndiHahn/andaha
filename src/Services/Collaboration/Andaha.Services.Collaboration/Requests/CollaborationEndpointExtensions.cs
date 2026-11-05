using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Collaboration.Requests;

public static class ConnectionEndpointExtensions
{
    internal static WebApplication MapConnectionEndpoint(this WebApplication app)
    {
        var income = app.NewVersionedApi("Collaboration");

        var groupBuilder = income.MapGroup("/api/connection").ApplyApiVersions();

        app.MapAcceptConnection(groupBuilder);
        app.MapDeclineConnection(groupBuilder);
        app.MapGetConnectedUserIds(groupBuilder);
        app.MapListConnectedAccounts(groupBuilder);
        app.MapListIncomingConnectionRequests(groupBuilder);
        app.MapListOutgoingConnectionRequests(groupBuilder);
        app.MapRequestAccountConnection(groupBuilder);
        app.MapRemoveConnection(groupBuilder);
        app.MapWithdrawConnectionRequest(groupBuilder);
        app.MapDeleteUserData(groupBuilder);

        return app;
    }

    private static WebApplication MapAcceptConnection(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePut<AcceptConnectionRequest.V1.AcceptConnectionRequestRequest>("accept/{fromUserId}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        return app;
    }

    private static WebApplication MapDeclineConnection(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeclineConnectionRequest.V1.DeclineConnectionRequestRequest>("decline/{fromUserId}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        return app;
    }

    private static WebApplication MapGetConnectedUserIds(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetConnectedUserIds.V1.GetConnectedUserIdsRequest>("users")
            .Produces<List<Guid>>();

        return app;
    }

    private static WebApplication MapListConnectedAccounts(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListConnectedAccounts.V1.ListConnectedAccountsRequest>("established")
            .Produces<List<Dtos.V1.ConnectionDto>>();

        return app;
    }

    private static WebApplication MapListIncomingConnectionRequests(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListIncomingConnectionRequests.V1.ListIncomingConnectionRequestsRequest>("incoming")
            .Produces<List<Dtos.V1.ConnectionRequestDto>>();

        return app;
    }

    private static WebApplication MapListOutgoingConnectionRequests(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListOutgoingConnectionRequests.V1.ListOutgoingConnectionRequestsRequest>("outgoing")
            .Produces<List<Dtos.V1.ConnectionRequestDto>>();

        return app;
    }

    private static WebApplication MapRequestAccountConnection(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<RequestAccountConnection.V1.RequestAccountConnectionRequest>("request")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    // Route disambiguation: "{userId:guid}" matches a single guid segment only, "user-data" is a literal
    // (and not a guid), "request/{targetUserId:guid}" has two segments and "decline/{fromUserId}" a different prefix.
    private static WebApplication MapRemoveConnection(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<RemoveConnection.V1.RemoveConnectionRequest>("{userId:guid}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapWithdrawConnectionRequest(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<WithdrawConnectionRequest.V1.WithdrawConnectionRequestRequest>("request/{targetUserId:guid}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapDeleteUserData(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteUserData.V1.DeleteUserDataRequest>("user-data")
            .Produces(StatusCodes.Status204NoContent);

        return app;
    }
}
