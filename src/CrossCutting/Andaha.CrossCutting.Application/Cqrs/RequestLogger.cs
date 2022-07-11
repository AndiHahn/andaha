using MediatR.Pipeline;
using Microsoft.Extensions.Logging;
using System.Text;

namespace Andaha.CrossCutting.Application.Cqrs;
public class RequestLogger<TRequest> : IRequestPreProcessor<TRequest>
    where TRequest : notnull
{
    private readonly ILogger<TRequest> logger;

    public RequestLogger(ILogger<TRequest> logger)
    {
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task Process(TRequest request, CancellationToken cancellationToken)
    {
        string requestName = typeof(TRequest).Name;

        var parameters = typeof(TRequest).GetProperties()
            .Select(p => (Name: p.Name, Value: p.GetValue(request, null) ?? "null"))
            .Aggregate(
                new StringBuilder().AppendLine(),
                (sb, property) => sb.AppendLine($"{property.Name}: {property.Value}"),
                sb => sb.ToString());

        this.logger.LogInformation("Process request: {name} with parameters: {parameters}", requestName, parameters);

        return Task.CompletedTask;
    }
}
