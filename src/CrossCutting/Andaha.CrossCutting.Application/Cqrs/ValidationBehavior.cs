using Andaha.CrossCutting.Application.Result;
using FluentValidation;
using MediatR;
using System.Reflection;

namespace Andaha.CrossCutting.Application.Cqrs;
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
    where TResponse : IResult
{
    private readonly IEnumerable<IValidator<TRequest>> validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        this.validators = validators;
    }

    public Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken, RequestHandlerDelegate<TResponse> next)
    {
        var context = new ValidationContext<TRequest>(request);

        var failures = validators
            .Select(async v => await v.ValidateAsync(context, cancellationToken))
            .SelectMany(task => task.Result.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
        {
            Type responseType = typeof(TResponse);
            if (typeof(IResult).IsAssignableFrom(responseType) ||
                typeof(IPagedResult).IsAssignableFrom(responseType))
            {
                MethodInfo? errorMethod = responseType.GetMethod(nameof(Result.Result.Error));
                var result = errorMethod?.Invoke(responseType, new[] { failures });
                return Task.FromResult((TResponse)result!);
            }

            throw new ArgumentException($"Response is not of type {nameof(Result)}.");
        }

        return next();
    }
}
