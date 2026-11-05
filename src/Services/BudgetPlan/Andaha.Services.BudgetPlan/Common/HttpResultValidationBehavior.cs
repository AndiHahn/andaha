using FluentValidation;
using FluentValidation.Results;
using MediatR;

namespace Andaha.Services.BudgetPlan.Common;

/// <summary>
/// Runs the FluentValidation validators of a request before its handler and answers 400 (ValidationProblem) on failures.
/// </summary>
/// <remarks>
/// The ValidationBehavior of Andaha.CrossCutting.Application is constrained to responses of its own
/// <c>Andaha.CrossCutting.Application.Result.IResult</c>. The handlers here return <see cref="IResult"/> of ASP.NET Core,
/// so the container silently skips that behavior and validators would never run.
/// </remarks>
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
