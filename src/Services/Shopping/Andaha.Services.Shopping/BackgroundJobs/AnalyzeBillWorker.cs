using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Requests.Bill.AnalyzeBill;

namespace Andaha.Services.Shopping.BackgroundJobs;

/// <summary>
/// Safety net behind the <see cref="ImmediateAnalysisService"/>: analyzes every unclaimed image in the analysis
/// repository through the <see cref="IBillAnalysisProcessor"/>. Every attempt claims the image for
/// <see cref="ClaimDuration"/> and counts an attempt (the immediate attempt after an upload counts as the first);
/// the processor deletes the image on success, a failure releases the claim for the next run.
/// An image that is still there after <see cref="MaxAttempts"/> attempts (or carries the legacy processed
/// marker) is handed to the <see cref="IFailedAnalysisImageHandler"/>.
/// </summary>
internal class AnalyzeBillWorker(
    ILogger<AnalyzeBillWorker> logger,
    IAnalysisImageRepository imageRepository,
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider) : BackgroundService
{
    internal const int MaxAttempts = 3;

    internal static readonly TimeSpan ClaimDuration = TimeSpan.FromMinutes(10);

    private readonly TimeSpan pollingInterval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AnalyzeBillWorker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollAndProcessAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                logger.LogInformation("AnalyzeBillWorker was stopped by intention.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during AnalyzeBlobWorker run.");
            }

            await Task.Delay(pollingInterval, stoppingToken);
        }

        logger.LogInformation("AnalyzeBlobWorker stopping.");
    }

    internal async Task PollAndProcessAsync(CancellationToken ct)
    {
        var allBlobs = await imageRepository.ListImagesAsync(ct);

        if (!allBlobs.Any())
        {
            return;
        }

        var ordered = allBlobs
            .OrderBy(blob => blob.LastModified)
            .ToList();

        foreach (var blob in ordered)
        {
            try
            {
                await ProcessImageAsync(blob, ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed processing analysis image '{BlobName}'. Will continue with next.", blob.ImageName);
            }
        }
    }

    private async Task ProcessImageAsync(ImageMetadata blob, CancellationToken ct)
    {
        var now = timeProvider.GetUtcNow();

        // An attempt is still in flight (immediate analysis after the upload, or an earlier run);
        // the processor deletes the image once it succeeds.
        if (blob.ClaimedUntilUtc > now)
        {
            return;
        }

        if (blob.LegacyProcessed || blob.Attempts >= MaxAttempts)
        {
            logger.LogWarning(
                "Analysis of image '{ImageName}' gave up after {Attempts} attempts (legacy processed: {LegacyProcessed}). Creating empty analyzed bill.",
                blob.ImageName,
                blob.Attempts,
                blob.LegacyProcessed);

            using var scope = scopeFactory.CreateScope();
            var failedImageHandler = scope.ServiceProvider.GetRequiredService<IFailedAnalysisImageHandler>();

            await failedImageHandler.HandleAsync(blob.ImageName, ct);

            return;
        }

        await imageRepository.ClaimAsync(blob.ImageName, now + ClaimDuration, ct);

        logger.LogInformation(
            "Analyzing image '{ImageName}' (lastModified={LastModified}, attempt={Attempt})",
            blob.ImageName,
            blob.LastModified,
            blob.Attempts + 1);

        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var processor = scope.ServiceProvider.GetRequiredService<IBillAnalysisProcessor>();

            await processor.ProcessAsync(blob.ImageName, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            // Retry on the next run (the attempt stays counted) instead of waiting for the claim to expire.
            await imageRepository.ReleaseClaimAsync(blob.ImageName, CancellationToken.None);

            throw;
        }

        logger.LogInformation("Successfully analyzed image '{ImageName}'", blob.ImageName);
    }
}
