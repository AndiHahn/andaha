using Andaha.CrossCutting.Application.Requests;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.BudgetPlan.Requests;

public static class WebApplicationExtensions
{
    public static RouteHandlerBuilder MediateGet<TRequest>(
        this IEndpointRouteBuilder routeBuilder,
        string template) where TRequest : IHttpRequest
    {
        return routeBuilder.MapGet(template, [Authorize] async (IMediator mediator, [AsParameters] TRequest request) => await mediator.Send(request));
    }

    public static RouteHandlerBuilder MediatePost<TRequest>(
        this IEndpointRouteBuilder routeBuilder,
        string template) where TRequest : IHttpRequest
    {
        return routeBuilder.MapPost(template, [Authorize] (IMediator mediator, [FromBody] TRequest request) => mediator.Send(request));
    }

    public static RouteHandlerBuilder MediatePut<TRequest>(
        this IEndpointRouteBuilder routeBuilder,
        string template) where TRequest : IHttpRequest
    {
        return routeBuilder.MapPut(template, [Authorize] (IMediator mediator, [AsParameters] TRequest request) => mediator.Send(request));
    }

    public static RouteHandlerBuilder MediateDelete<TRequest>(
        this IEndpointRouteBuilder routeBuilder,
        string template) where TRequest : IHttpRequest
    {
        return routeBuilder.MapDelete(template, [Authorize] (IMediator mediator, [AsParameters] TRequest request) => mediator.Send(request));
    }
}
