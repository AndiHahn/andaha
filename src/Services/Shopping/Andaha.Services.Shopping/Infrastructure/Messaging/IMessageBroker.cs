namespace Andaha.Services.Shopping.Infrastructure.Messaging;

public interface IMessageBroker
{
    public Task PublishMessageAsync<TMessage>(TMessage message, CancellationToken ct);
}