using Dapr.Client;

namespace Andaha.Services.Shopping.Infrastructure.Messaging;

public class DaprMessageBroker(DaprClient daprClient) : IMessageBroker
{
    public async Task PublishMessageAsync<TMessage>(TMessage message, CancellationToken ct)
    {
        await daprClient.PublishEventAsync(
            pubsubName: "pubsub",
            topicName: typeof(TMessage).Name,
            data: message,
            ct);
    }
}
