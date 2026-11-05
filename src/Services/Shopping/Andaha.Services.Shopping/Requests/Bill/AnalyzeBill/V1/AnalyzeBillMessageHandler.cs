using Andaha.Services.Shopping.Contracts;
using MediatR;

namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V1;

/// <summary>
/// Pub/sub entry point (Dapr topic <c>AnalyzeBillMessageV1</c>). Since US-0009 nothing publishes this message any more;
/// the handler stays for messages still queued in the broker from before and delegates to the shared processor.
/// </summary>
internal class AnalyzeBillMessageHandler(IBillAnalysisProcessor processor) : IRequestHandler<AnalyzeBillMessageV1, IResult>
{
    public async Task<IResult> Handle(AnalyzeBillMessageV1 request, CancellationToken cancellationToken)
    {
        await processor.ProcessAsync(request.ImageName, cancellationToken);

        return Results.Ok();
    }
}
