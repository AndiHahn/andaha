using Andaha.CrossCutting.Application.Cqrs;
using Andaha.CrossCutting.Application.Identity;
using FluentValidation;
using FluentValidation.AspNetCore;
using MediatR;
using MediatR.Pipeline;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Reflection;

namespace Andaha.CrossCutting.Application;
public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddCqrs(this IServiceCollection services, Assembly assembly)
    {
        services.AddMediatR(assembly);

        services.TryAddEnumerable(ServiceDescriptor.Transient(typeof(IRequestPreProcessor<>), typeof(RequestLogger<>)));
        services.TryAddEnumerable(ServiceDescriptor.Transient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>)));

        services.AddFluentValidation(config => config.RegisterValidatorsFromAssembly(assembly));

        ValidatorOptions.Global.LanguageManager.Enabled = true;

        return services;
    }

    public static IServiceCollection AddIdentityServices(this IServiceCollection services)
    {
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IConnectedUsersService, ConnectedUsersService>();

        return services;
    }
}
