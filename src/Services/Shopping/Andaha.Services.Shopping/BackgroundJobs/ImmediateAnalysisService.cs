using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Requests.Bill.AnalyzeBill;

namespace Andaha.Services.Shopping.BackgroundJobs;

/// <summary>
/// Analyzes uploaded images right away instead of waiting for the next <see cref="AnalyzeBillWorker"/> run (US-0009).
/// The upload has already claimed the image and counted this attempt, so the worker leaves it alone meanwhile.
/// Before analyzing, the short upload claim is extended to <see cref="AnalyzeBillWorker.ClaimDuration"/>;
/// an image whose upload claim has lapsed belongs to the worker and is skipped.
/// On failure the claim is released and the worker retries on its next run, within the usual attempt limit.
/// </summary>
internal sealed class ImmediateAnalysisService(
    AnalysisQueue queue,
    IServiceScopeFactory scopeFactory,
    IAnalysisImageRepository imageRepository,
    TimeProvider timeProvider,
    ILogger<ImmediateAnalysisService> logger) : BackgroundService
{
    /// <summary>
    /// Several photos taken in a row are analyzed side by side instead of waiting for each other.
    /// </summary>
    internal const int MaxParallelAnalyses = 4;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ImmediateAnalysisService started.");

        try
        {
            await Parallel.ForEachAsync(
                queue.ReadAllAsync(stoppingToken),
                new ParallelOptions { MaxDegreeOfParallelism = MaxParallelAnalyses, CancellationToken = stoppingToken },
                async (imageName, ct) => await ProcessAsync(imageName, ct));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation("ImmediateAnalysisService was stopped by intention.");
        }
    }

    internal async Task ProcessAsync(string imageName, CancellationToken ct)
    {
        if (!await TryTakeOverUploadClaimAsync(imageName, ct))
        {
            return;
        }

        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var processor = scope.ServiceProvider.GetRequiredService<IBillAnalysisProcessor>();

            await processor.ProcessAsync(imageName, ct);

            logger.LogInformation("Immediate analysis of image '{ImageName}' finished.", imageName);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Shutting down: the claim expires by itself and the worker takes over.
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Immediate analysis of image '{ImageName}' failed. Releasing the claim for the worker.", imageName);

            await imageRepository.TryReleaseClaimAsync(imageName, logger);
        }
    }

    /// <summary>
    /// Re-reads the image right before analyzing it. Only an image still under its upload claim
    /// (claim active, no attempt beyond the counted upload attempt) is analyzed here; its claim is then extended
    /// without counting an attempt. Anything else belongs to the worker or is already done.
    /// </summary>
    private async Task<bool> TryTakeOverUploadClaimAsync(string imageName, CancellationToken ct)
    {
        try
        {
            var image = await imageRepository.GetMetadataAsync(imageName, ct);
            var now = timeProvider.GetUtcNow();

            if (image is null || !(image.ClaimedUntilUtc > now) || image.Attempts > 1)
            {
                logger.LogInformation(
                    "Skipping immediate analysis of image '{ImageName}' (exists: {Exists}, claimed until: {ClaimedUntil}, attempts: {Attempts}); the worker owns it.",
                    imageName,
                    image is not null,
                    image?.ClaimedUntilUtc,
                    image?.Attempts);

                return false;
            }

            await imageRepository.ExtendClaimAsync(imageName, now + AnalyzeBillWorker.ClaimDuration, ct);

            return true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            // The upload claim stays as it is and runs out; the worker takes over then.
            logger.LogError(ex, "Could not take over the upload claim of image '{ImageName}'. Leaving it to the worker.", imageName);

            return false;
        }
    }
}
