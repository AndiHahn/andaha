using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Requests.Bill.AnalyzeBill;

namespace Andaha.Services.Shopping.BackgroundJobs;

/// <summary>
/// Analyzes uploaded images right away instead of waiting for the next <see cref="AnalyzeBillWorker"/> run (US-0009).
/// The upload has already claimed the image and counted this attempt, so the worker leaves it alone meanwhile.
/// On failure the claim is released and the worker retries on its next run, within the usual attempt limit.
/// </summary>
internal sealed class ImmediateAnalysisService(
    AnalysisQueue queue,
    IServiceScopeFactory scopeFactory,
    IAnalysisImageRepository imageRepository,
    ILogger<ImmediateAnalysisService> logger) : BackgroundService
{
    /// <summary>
    /// Several photos taken in a row are analyzed side by side, so none of them waits in the queue
    /// until its upload claim has expired and the worker takes it as well.
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
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var processor = scope.ServiceProvider.GetRequiredService<IBillAnalysisProcessor>();

            await processor.ProcessAsync(imageName, ct);

            logger.LogInformation("Immediate analysis of image '{ImageName}' finished.", imageName);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Shutting down: the claim from the upload expires by itself and the worker takes over.
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Immediate analysis of image '{ImageName}' failed. Releasing the claim for the worker.", imageName);

            await ReleaseClaimAsync(imageName);
        }
    }

    private async Task ReleaseClaimAsync(string imageName)
    {
        try
        {
            await imageRepository.ReleaseClaimAsync(imageName, CancellationToken.None);
        }
        catch (Exception ex)
        {
            // Not fatal: the claim from the upload runs out after two minutes anyway.
            logger.LogWarning(ex, "Could not release the claim of image '{ImageName}'.", imageName);
        }
    }
}
