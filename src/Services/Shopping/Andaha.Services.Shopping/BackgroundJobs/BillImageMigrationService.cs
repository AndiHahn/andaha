using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

namespace Andaha.Services.Shopping.BackgroundJobs;

/// <summary>
/// Moves existing bill images with legacy names to the structured layout once at startup (US-0012).
/// Runs in the background; on an error it logs and stops, the next start retries.
/// </summary>
internal sealed class BillImageMigrationService(
    IServiceScopeFactory scopeFactory,
    ILogger<BillImageMigrationService> logger) : BackgroundService
{
    internal const int BatchSize = 50;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Do not delay the startup of the host.
        await Task.Yield();

        try
        {
            int total = await RunAsync(stoppingToken);
            logger.LogInformation("Bill image migration finished. {Count} image(s) migrated.", total);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation("Bill image migration was stopped by intention.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bill image migration failed. It is retried on the next start.");
        }
    }

    internal async Task<int> RunAsync(CancellationToken ct)
    {
        var skipped = new HashSet<Guid>();
        int total = 0;

        while (true)
        {
            int skippedBefore = skipped.Count;

            await using var scope = scopeFactory.CreateAsyncScope();
            var migrator = new BillImageMigrator(
                scope.ServiceProvider.GetRequiredService<ShoppingDbContext>(),
                scope.ServiceProvider.GetRequiredService<IImageRepository>(),
                scope.ServiceProvider.GetRequiredService<ILogger<BillImageMigrator>>());

            int migrated = await migrator.MigrateBatchAsync(BatchSize, skipped, ct);
            total += migrated;

            // Every candidate is either migrated or skipped, so no progress means no candidates left.
            if (migrated == 0 && skipped.Count == skippedBefore)
            {
                return total;
            }
        }
    }
}
