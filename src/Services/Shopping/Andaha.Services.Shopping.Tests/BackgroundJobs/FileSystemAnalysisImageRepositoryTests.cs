using System.Text.Json;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

namespace Andaha.Services.Shopping.Tests.BackgroundJobs;

public sealed class FileSystemAnalysisImageRepositoryTests : IDisposable
{
    // Upload ohne Claim, wie vom NasBillWorker
    private static readonly AnalysisUploadOptions Unclaimed = new()
    {
        UploadedAtUtc = new DateTimeOffset(2026, 11, 4, 11, 0, 0, TimeSpan.Zero),
        Origin = AnalysisUploadOptions.NasOrigin,
    };

    private readonly string directory = Path.Combine(Path.GetTempPath(), "andaha-analysis-" + Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        if (Directory.Exists(directory))
        {
            Directory.Delete(directory, recursive: true);
        }
    }

    [Fact]
    public async Task Claim_updates_existing_metadata_sidecar()
    {
        var repository = new FileSystemAnalysisImageRepository(directory);
        var userId = Guid.NewGuid();
        await repository.UploadImageAsync("a.jpg", new MemoryStream([1, 2, 3]), userId, Unclaimed);
        var claimedUntil = new DateTimeOffset(2026, 11, 4, 12, 10, 0, TimeSpan.Zero);

        await repository.ClaimAsync("a.jpg", claimedUntil);
        await repository.ClaimAsync("a.jpg", claimedUntil.AddMinutes(10));

        var files = Directory.GetFiles(directory).Select(file => Path.GetFileName(file)).Order().ToArray();
        Assert.Equal(["a.jpg", "a.jpg.metadata.json"], files);

        using var json = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(directory, "a.jpg.metadata.json")));
        Assert.Equal(userId.ToString(), json.RootElement.GetProperty("userId").GetString());
        Assert.Equal(2, json.RootElement.GetProperty("attempts").GetInt32());

        var (image, owner) = await repository.GetImageAsync("a.jpg");
        using (image)
        {
            Assert.Equal(userId, owner);
        }
    }

    [Fact]
    public async Task List_skips_sidecars_and_reports_attempts()
    {
        var repository = new FileSystemAnalysisImageRepository(directory);
        await repository.UploadImageAsync("a.jpg", new MemoryStream([1]), Guid.NewGuid(), Unclaimed);
        await repository.UploadImageAsync("b.jpg", new MemoryStream([2]), Guid.NewGuid(), Unclaimed);
        var claimedUntil = new DateTimeOffset(2026, 11, 4, 12, 10, 0, TimeSpan.Zero);
        await repository.ClaimAsync("b.jpg", claimedUntil);
        await File.WriteAllTextAsync(
            Path.Combine(directory, "legacy.jpg.metadata.json"),
            JsonSerializer.Serialize(new { userId = Guid.NewGuid().ToString(), processedAt = "2026-01-01T00:00:00.0000000+00:00" }));
        await File.WriteAllBytesAsync(Path.Combine(directory, "legacy.jpg"), [3]);

        var images = (await repository.ListImagesAsync()).OrderBy(image => image.ImageName).ToArray();

        Assert.Equal(["a.jpg", "b.jpg", "legacy.jpg"], images.Select(image => image.ImageName));

        Assert.Equal(0, images[0].Attempts);
        Assert.Null(images[0].ClaimedUntilUtc);
        Assert.False(images[0].LegacyProcessed);

        Assert.Equal(1, images[1].Attempts);
        Assert.Equal(claimedUntil, images[1].ClaimedUntilUtc);
        Assert.False(images[1].LegacyProcessed);

        Assert.True(images[2].LegacyProcessed);
    }

    [Fact]
    public async Task List_reports_owner_from_metadata()
    {
        var repository = new FileSystemAnalysisImageRepository(directory);
        var userId = Guid.NewGuid();
        await repository.UploadImageAsync("a.jpg", new MemoryStream([1]), userId, Unclaimed);
        await File.WriteAllBytesAsync(Path.Combine(directory, "without-sidecar.jpg"), [2]);

        var images = (await repository.ListImagesAsync()).OrderBy(image => image.ImageName).ToArray();

        Assert.Equal(userId, images[0].UserId);
        Assert.Null(images[1].UserId);
    }
}
