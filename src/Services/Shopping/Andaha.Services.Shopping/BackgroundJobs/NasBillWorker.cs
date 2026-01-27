using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Nas;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.BackgroundJobs;

internal class NasBillWorker(
    INasImageRepository nasImageRepository,
    IAnalysisImageRepository analysisImageRepository,
    IServiceScopeFactory scopeFactory,
    ILogger<NasBillWorker> logger) : BackgroundService
{
    private readonly TimeSpan pollingInterval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("NasBillWorker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollAndProcessAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                logger.LogInformation("NasBillWorker was stopped by intention.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during NasBillWorker run.");
            }

            await Task.Delay(pollingInterval, stoppingToken);
        }

        logger.LogInformation("NasBillWorker stopping.");
    }

    protected async Task PollAndProcessAsync(CancellationToken stoppingToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ShoppingDbContext>();

        var state = await dbContext.AnalyzeBillProcessingState.FirstOrDefaultAsync(stoppingToken);
        if (state is null)
        {
            state = new AnalyzeBillProcessingState { LastProcessedUtc = null };

            dbContext.AnalyzeBillProcessingState.Add(state);

            await dbContext.SaveChangesAsync(stoppingToken);
        }

        var lastProcessed = state.LastProcessedUtc ?? DateTimeOffset.MinValue;

        var allBlobs = await nasImageRepository.ListImagesAsync(stoppingToken);

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
            try
            {
                logger.LogInformation("Publishing analyze message for blob '{BlobName}' (lastModified={LastModified})", blob.ImageName, blob.LastModified);

                var file = await nasImageRepository.GetImageAsync(blob.ImageName, stoppingToken);

                await analysisImageRepository.UploadImageAsync(blob.ImageName, file.Image, file.UserId, stoppingToken);

                state.LastProcessedUtc = blob.LastModified;

                await dbContext.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed publishing analyze message for blob '{BlobName}'. Will continue with next.", blob.ImageName);
            }
        }
    }
}
