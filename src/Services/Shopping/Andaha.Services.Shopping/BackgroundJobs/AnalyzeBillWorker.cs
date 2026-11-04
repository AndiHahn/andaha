using Andaha.Services.Shopping.Contracts;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.Messaging;

namespace Andaha.Services.Shopping.BackgroundJobs;

/// <summary>
/// Publishes an analysis message for each image in the analysis repository. Every publish claims the image
/// for <see cref="ClaimDuration"/> and counts an attempt; the message handler deletes the image on success.
/// An image that is still there after <see cref="MaxAttempts"/> attempts (or carries the legacy processed
/// marker) is handed to the <see cref="IFailedAnalysisImageHandler"/>.
/// </summary>
internal class AnalyzeBillWorker(
    ILogger<AnalyzeBillWorker> logger,
    IAnalysisImageRepository imageRepository,
    IMessageBroker messageBroker,
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

        // An attempt is still in flight; the message handler deletes the image once it succeeds.
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

        var message = new AnalyzeBillMessageV1
        {
            ImageName = blob.ImageName,
            LastModifiedUtc = blob.LastModified.ToUniversalTime()
        };

        logger.LogInformation(
            "Publishing analyze message for blob '{BlobName}' (lastModified={LastModified}, attempt={Attempt})",
            blob.ImageName,
            blob.LastModified,
            blob.Attempts + 1);

        await messageBroker.PublishMessageAsync(message, ct);

        logger.LogInformation("Successfully published analyze message for blob '{ImageName}'", blob.ImageName);
    }
}
