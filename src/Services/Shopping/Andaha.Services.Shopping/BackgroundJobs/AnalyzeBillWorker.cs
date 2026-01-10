using Andaha.Services.Shopping.Contracts;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepository;
using Andaha.Services.Shopping.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.BackgroundJobs;

internal class AnalyzeBillWorker(
    ILogger<AnalyzeBillWorker> logger,
    IImageRepository imageRepository,
    IServiceScopeFactory scopeFactory,
    IMessageBroker messageBroker) : BackgroundService
{
    private readonly string containerName = "analyze";
    private readonly TimeSpan pollingInterval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AnalyzeBillWorker started. Polling container '{ContainerName}'", containerName);

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
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ShoppingDbContext>();

        var state = await dbContext.AnalyzeBillProcessingState.FirstOrDefaultAsync(ct);
        if (state is null)
        {
            state = new AnalyzeBillProcessingState { LastProcessedUtc = null };

            dbContext.AnalyzeBillProcessingState.Add(state);

            await dbContext.SaveChangesAsync(ct);
        }

        var lastProcessed = state.LastProcessedUtc ?? DateTimeOffset.MinValue;

        var allBlobs = await imageRepository.ListIAnalyzeImagesAsync(ct);

        var newBlobs = allBlobs
            .Where(blob => blob.LastModified > lastProcessed)
            .ToArray();

        if (!newBlobs.Any())
        {
            return;
        }

        var ordered = newBlobs
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

                state.LastProcessedUtc = message.LastModifiedUtc;

                await dbContext.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed publishing analyze message for blob '{BlobName}'. Will continue with next.", blob.ImageName);
            }
        }
    }
}