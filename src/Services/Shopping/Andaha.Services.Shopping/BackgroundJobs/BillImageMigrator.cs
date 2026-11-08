using System.Globalization;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Azure;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.BackgroundJobs;

/// <summary>
/// Moves bill images that still carry a legacy flat name ("{id}-{n}") to their structured path (US-0012).
/// Every step is idempotent, so several instances may run it at the same time:
/// upload to the target, conditional rename in the database, delete the old blob.
/// </summary>
internal sealed class BillImageMigrator(
    ShoppingDbContext dbContext,
    IImageRepository imageRepository,
    ILogger<BillImageMigrator> logger)
{
    private readonly HashSet<Guid> ownSkipped = [];

    /// <summary>Test hook: runs right before the conditional database update.</summary>
    internal Func<Task>? BeforeUpdate { get; set; }

    public Task<int> MigrateBatchAsync(int batchSize, CancellationToken ct)
        => MigrateBatchAsync(batchSize, ownSkipped, ct);

    /// <summary>
    /// Migrates up to <paramref name="batchSize"/> images and returns how many were migrated.
    /// Images that cannot be migrated in this run (missing blob, orphan, changed concurrently, error)
    /// are added to <paramref name="skipped"/> and excluded from later batches.
    /// </summary>
    public async Task<int> MigrateBatchAsync(int batchSize, ISet<Guid> skipped, CancellationToken ct)
    {
        var skippedIds = skipped.ToList();

        var candidates = await dbContext.BillImage
            .AsNoTracking()
            .Where(i => !i.Name.Contains("/") && !skippedIds.Contains(i.Id))
            .OrderBy(i => i.Id)
            .Take(batchSize)
            .Select(i => new Candidate(
                i.Id,
                i.Name,
                i.BillId,
                i.Bill != null ? i.Bill.UserId : null,
                i.Bill != null ? i.Bill.Date : null,
                i.Bill != null ? i.Bill.ShopName : null,
                i.AnalyzedBillId,
                i.AnalyzedBill != null ? i.AnalyzedBill.UserId : null,
                i.AnalyzedBill != null ? i.AnalyzedBill.CreatedAt : null))
            .ToListAsync(ct);

        int migrated = 0;
        foreach (var candidate in candidates)
        {
            bool done;
            try
            {
                done = await MigrateAsync(candidate, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Migrating bill image '{ImageName}' failed. It is retried on the next start.", candidate.Name);
                done = false;
            }

            if (done)
            {
                migrated++;
            }
            else
            {
                skipped.Add(candidate.Id);
            }
        }

        return migrated;
    }

    private async Task<bool> MigrateAsync(Candidate c, CancellationToken ct)
    {
        if (c.BillUserId is null && c.ScanUserId is null)
        {
            logger.LogWarning("Bill image '{ImageName}' belongs to neither a bill nor a scan. Skipping it.", c.Name);

            return false;
        }

        byte[] bytes;
        try
        {
            await using var source = await imageRepository.GetImageStreamAsync(c.Name, ct);
            using var buffer = new MemoryStream();
            await source.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }
        catch (Exception ex) when (IsMissing(ex))
        {
            logger.LogWarning("The blob of bill image '{ImageName}' does not exist. Skipping it.", c.Name);

            return false;
        }

        using var stream = new MemoryStream(bytes);
        var fileType = await logger.DetectOrWarnAsync(stream, c.Name, ct);

        string target = c.BillUserId is { } userId
            ? BillImagePath.ForBill(userId, c.BillDate!.Value, c.BillShopName, c.BillId!.Value, NumberOf(c.Name), fileType.Extension)
            : BillImagePath.ForScan(c.ScanUserId!.Value, c.ScanCreatedAt!.Value, c.AnalyzedBillId!.Value, fileType.Extension);

        await imageRepository.UploadImageAsync(target, stream, fileType.ContentType, ct);

        if (BeforeUpdate is not null)
        {
            await BeforeUpdate();
        }

        int updated = await dbContext.BillImage
            .Where(i => i.Id == c.Id && i.Name == c.Name)
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.Name, target), ct);

        if (updated == 0)
        {
            logger.LogWarning("Bill image '{ImageName}' was changed in the meantime. Leaving it as it is.", c.Name);

            return false;
        }

        await imageRepository.DeleteImageAsync(c.Name, ct);

        return true;
    }

    private static bool IsMissing(Exception ex)
        => ex is FileNotFoundException or DirectoryNotFoundException or RequestFailedException { Status: 404 };

    // Legacy names are "{guid}-{n}"; scans always use 1.
    private static int NumberOf(string name)
    {
        int dash = name.LastIndexOf('-');

        return dash >= 0 && int.TryParse(name[(dash + 1)..], NumberStyles.None, CultureInfo.InvariantCulture, out int n) ? n : 1;
    }

    private sealed record Candidate(
        Guid Id,
        string Name,
        Guid? BillId,
        Guid? BillUserId,
        DateTime? BillDate,
        string? BillShopName,
        Guid? AnalyzedBillId,
        Guid? ScanUserId,
        DateTime? ScanCreatedAt);
}
