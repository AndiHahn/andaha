using Andaha.Services.Shopping.Contracts;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.Messaging;

namespace Andaha.Services.Shopping.BackgroundJobs;

internal class AnalyzeBillWorker(
    ILogger<AnalyzeBillWorker> logger,
    IAnalysisImageRepository imageRepository,
    IMessageBroker messageBroker) : BackgroundService
{
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

    private async Task PollAndProcessAsync(CancellationToken ct)
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
            var message = new AnalyzeBillMessageV1
            {
                ImageName = blob.ImageName,
                LastModifiedUtc = blob.LastModified.ToUniversalTime()
            };

            try
            {
                logger.LogInformation("Publishing analyze message for blob '{BlobName}' (lastModified={LastModified})", blob.ImageName, blob.LastModified);
                
                await messageBroker.PublishMessageAsync(message, ct);

                logger.LogInformation("Successfully processed blob '{ImageName}'", blob.ImageName);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed publishing analyze message for blob '{BlobName}'. Will continue with next.", blob.ImageName);
            }
        }
    }
}