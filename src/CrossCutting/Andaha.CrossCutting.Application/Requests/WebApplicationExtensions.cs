using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Andaha.CrossCutting.Application.Requests;

public static class WebApplicationExtensions
{
    public static RouteHandlerBuilder MediateGet<TRequest>(
        this IEndpointRouteBuilder routeBuilder,
        string template) where TRequest : IHttpRequest
        => routeBuilder.MapGet(template, [Authorize] async (IMediator mediator, [AsParameters] TRequest request)
            => await mediator.Send(request));

    public static RouteHandlerBuilder MediatePost<TRequest>(
        this IEndpointRouteBuilder routeBuilder,
        string template) where TRequest : IHttpRequest
        => routeBuilder.MapPost(template, [Authorize] (IMediator mediator, [AsParameters] TRequest request)
            => mediator.Send(request));

    public static RouteHandlerBuilder MediatePut<TRequest>(
        this IEndpointRouteBuilder routeBuilder,
        string template) where TRequest : IHttpRequest
    => routeBuilder.MapPut(template, [Authorize] (IMediator mediator, [AsParameters] TRequest request)
        => mediator.Send(request));

    public static RouteHandlerBuilder MediateDelete<TRequest>(
        this IEndpointRouteBuilder routeBuilder,
        string template) where TRequest : IHttpRequest
    => routeBuilder.MapDelete(template, [Authorize] (IMediator mediator, [AsParameters] TRequest request)
        => mediator.Send(request));
}
