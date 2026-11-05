using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Reflection;

namespace Andaha.Services.BudgetPlan.Common;

internal static class ValidationServiceCollectionExtensions
{
    /// <summary>
    /// Registers <see cref="HttpResultValidationBehavior{TRequest}"/> for every request of the assembly that has a validator
    /// and is handled with an ASP.NET Core <see cref="IResult"/>. The registrations are closed per request, so in the
    /// Monolith the pipelines of the other services' requests stay unchanged.
    /// </summary>
    public static IServiceCollection AddHttpResultValidation(this IServiceCollection services, Assembly assembly)
    {
        var validatedRequestTypes = assembly.GetTypes()
            .Where(type => type is { IsAbstract: false, IsGenericTypeDefinition: false })
            .SelectMany(type => type.GetInterfaces())
            .Where(contract => contract.IsGenericType && contract.GetGenericTypeDefinition() == typeof(IValidator<>))
            .Select(contract => contract.GetGenericArguments()[0])
            .Where(requestType => typeof(IRequest<IResult>).IsAssignableFrom(requestType))
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
