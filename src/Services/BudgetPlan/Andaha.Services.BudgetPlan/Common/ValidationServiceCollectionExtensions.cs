using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Reflection;

namespace Andaha.Services.BudgetPlan.Common;

internal static class ValidationServiceCollectionExtensions
{
    /// <summary>
    /// Registers <see cref="HttpResultValidationBehavior{TRequest}"/> for every request of the assembly that has a validator
    /// and implements exactly <c>IRequest&lt;Microsoft.AspNetCore.Http.IResult&gt;</c> (requests that only match covariantly,
    /// e.g. <c>IRequest&lt;Ok&lt;T&gt;&gt;</c>, are left out). The registrations are closed per request, so in the Monolith
    /// the pipelines of the other services' requests stay unchanged. The validators themselves are registered by
    /// <c>AddCqrs</c>, which only picks up public validator types.
    /// </summary>
    public static IServiceCollection AddHttpResultValidation(this IServiceCollection services, Assembly assembly)
    {
        var validatedRequestTypes = assembly.GetTypes()
            .Where(type => type is { IsAbstract: false, IsGenericTypeDefinition: false })
            .SelectMany(type => type.GetInterfaces())
            .Where(contract => contract.IsGenericType && contract.GetGenericTypeDefinition() == typeof(IValidator<>))
            .Select(contract => contract.GetGenericArguments()[0])
            .Where(requestType => requestType.GetInterfaces().Contains(typeof(IRequest<IResult>)))
            .Distinct();

        foreach (var requestType in validatedRequestTypes)
        {
            services.TryAddEnumerable(ServiceDescriptor.Transient(
                typeof(IPipelineBehavior<,>).MakeGenericType(requestType, typeof(IResult)),
                typeof(HttpResultValidationBehavior<>).MakeGenericType(requestType)));
        }

        return services;
    }
}
