using System.Diagnostics.CodeAnalysis;
using System.Threading.Channels;

namespace Andaha.Services.Shopping.BackgroundJobs;

/// <summary>
/// In-process queue of freshly uploaded analysis images (US-0009), read by the <see cref="ImmediateAnalysisService"/>.
/// It lives in memory only: whatever is lost on a restart is picked up by the <see cref="AnalyzeBillWorker"/>
/// once the upload claim has expired.
/// </summary>
internal sealed class AnalysisQueue
{
    private readonly Channel<string> channel = Channel.CreateUnbounded<string>(new UnboundedChannelOptions
    {
        SingleReader = true,
    });

    public void Enqueue(string imageName)
    {
        // An unbounded channel accepts every write until it is completed, which never happens.
        if (!channel.Writer.TryWrite(imageName))
        {
            throw new InvalidOperationException("The analysis queue does not accept images.");
        }
    }

    public IAsyncEnumerable<string> ReadAllAsync(CancellationToken ct) => channel.Reader.ReadAllAsync(ct);

    internal bool TryDequeue([MaybeNullWhen(false)] out string imageName) => channel.Reader.TryRead(out imageName);
}
