using FluentValidation;
using FluentValidation.Results;
using MediatR;

namespace Andaha.Services.Shopping.Common;

/// <summary>
/// Runs the FluentValidation validators of a request whose handler returns an ASP.NET Core <see cref="IResult"/>.
/// The shared ValidationBehavior of Andaha.CrossCutting.Application is constrained to its own Result type and is
/// therefore skipped for these requests. On validation failures the request is answered with a 400 validation problem
/// and the handler is not called.
/// </summary>
internal sealed class HttpResultValidationBehavior<TRequest> : IPipelineBehavior<TRequest, IResult>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> validators;

    public HttpResultValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        this.validators = validators ?? throw new ArgumentNullException(nameof(validators));
    }

    public async Task<IResult> Handle(TRequest request, RequestHandlerDelegate<IResult> next, CancellationToken cancellationToken)
    {
        var context = new ValidationContext<TRequest>(request);

        // Sequentially: async validators share the scoped DbContext, which does not allow parallel queries.
        var failures = new List<ValidationFailure>();
        foreach (var validator in this.validators)
        {
            var result = await validator.ValidateAsync(context, cancellationToken);
            failures.AddRange(result.Errors);
        }

        if (failures.Count != 0)
        {
            var errors = failures
                .GroupBy(failure => failure.PropertyName)
                .ToDictionary(group => group.Key, group => group.Select(failure => failure.ErrorMessage).ToArray());

            return TypedResults.ValidationProblem(errors);
        }

        return await next(cancellationToken);
    }
}
