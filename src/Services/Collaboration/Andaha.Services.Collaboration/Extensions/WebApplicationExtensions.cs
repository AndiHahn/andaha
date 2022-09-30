using Andaha.Services.Collaboration.Requests;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace Andaha.Services.Collaboration.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication MediateGet<TRequest>(
        this WebApplication app,
        string template) where TRequest : IHttpRequest
    {
        app.MapGet(template, [Authorize] async (IMediator mediator, [AsParameters] TRequest request)
            => await mediator.Send(request));

        return app;
    }

    public static WebApplication MediatePost<TRequest>(
        this WebApplication app,
        string template) where TRequest : IHttpRequest
    {
        app.MapPost(template, [Authorize] async (IMediator mediator, [AsParameters] TRequest request)
            => await mediator.Send(request));

        return app;
    }

    public static WebApplication MediatePut<TRequest>(
        this WebApplication app,
        string template) where TRequest : IHttpRequest
    {
        app.MapPut(template, [Authorize] async (IMediator mediator, [AsParameters] TRequest request)
            => await mediator.Send(request));

        return app;
    }

    public static WebApplication MediateDelete<TRequest>(
        this WebApplication app,
        string template) where TRequest : IHttpRequest
    {
        app.MapDelete(template, [Authorize] async (IMediator mediator, [AsParameters] TRequest request)
            => await mediator.Send(request));

        return app;
    }
}
