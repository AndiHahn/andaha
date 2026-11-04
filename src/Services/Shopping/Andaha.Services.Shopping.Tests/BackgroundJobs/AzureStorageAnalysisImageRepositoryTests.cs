using System.Net.Sockets;
using Andaha.Services.Shopping.BackgroundJobs;
using Andaha.Services.Shopping.Contracts;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.Messaging;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.BackgroundJobs;

/// <summary>
/// Runs only when Azurite listens on 127.0.0.1:10000 (blob service), otherwise the test is reported as skipped:
/// <c>docker run -d --rm -p 10000:10000 mcr.microsoft.com/azure-storage/azurite azurite-blob --blobHost 0.0.0.0 --skipApiVersionCheck</c>.
/// </summary>
public sealed class AzuriteFactAttribute : FactAttribute
{
    private static readonly Lazy<bool> Available = new(IsAzuriteReachable);

    public AzuriteFactAttribute()
    {
        if (!Available.Value)
        {
            Skip = "Azurite (blob, port 10000) is not running.";
        }
    }

    private static bool IsAzuriteReachable()
    {
        try
        {
            using var client = new TcpClient();
            return client.ConnectAsync("127.0.0.1", 10000).Wait(TimeSpan.FromMilliseconds(500)) && client.Connected;
        }
        catch (Exception)
        {
            return false;
        }
    }
}

/// <summary>
/// Integration tests of the production analysis repository against Azurite: blob metadata round trip of
/// claim/attempts, preserved userId and the legacy <c>processedAt</c> flag (AC35, final review I5).
/// </summary>
public sealed class AzureStorageAnalysisImageRepositoryTests : IAsyncLifetime
{
    // Well-known Azurite development account (public, documented default; not a secret)
    private const string AzuriteConnectionString = "UseDevelopmentStorage=true";

    private readonly BlobServiceClient blobServiceClient = new(AzuriteConnectionString);

    private BlobContainerClient Container => blobServiceClient.GetBlobContainerClient("analysis");

    public async Task InitializeAsync()
    {
        if (!await IsReachableAsync())
        {
            return;
        }

        await Container.CreateIfNotExistsAsync();
        await foreach (var blob in Container.GetBlobsAsync())
        {
            await Container.DeleteBlobIfExistsAsync(blob.Name);
        }
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [AzuriteFact]
    public async Task Claim_increments_attempts_sets_claim_and_keeps_userId()
    {
        var repository = new AzureStorageAnalysisImageRepository(blobServiceClient);
        var userId = Guid.NewGuid();
        await repository.UploadImageAsync("a.jpg", new MemoryStream([1, 2, 3]), userId);
        var claimedUntil = new DateTimeOffset(2026, 11, 4, 12, 10, 0, TimeSpan.Zero);

        await repository.ClaimAsync("a.jpg", claimedUntil);
        await repository.ClaimAsync("a.jpg", claimedUntil.AddMinutes(10));

        var image = Assert.Single(await repository.ListImagesAsync());
        Assert.Equal("a.jpg", image.ImageName);
        Assert.Equal(2, image.Attempts);
        Assert.Equal(claimedUntil.AddMinutes(10), image.ClaimedUntilUtc);
        Assert.False(image.LegacyProcessed);

        var (stream, owner) = await repository.GetImageAsync("a.jpg");
        await using (stream)
        {
            Assert.Equal(userId, owner);
            using var copy = new MemoryStream();
            await stream.CopyToAsync(copy);
            Assert.Equal([1, 2, 3], copy.ToArray());
        }
    }

    [AzuriteFact]
    public async Task List_reports_new_images_claims_and_legacy_processed_blobs()
    {
        var repository = new AzureStorageAnalysisImageRepository(blobServiceClient);
        await repository.UploadImageAsync("new.jpg", new MemoryStream([1]), Guid.NewGuid());
        await repository.UploadImageAsync("claimed.jpg", new MemoryStream([2]), Guid.NewGuid());
        var claimedUntil = new DateTimeOffset(2026, 11, 4, 12, 10, 0, TimeSpan.Zero);
        await repository.ClaimAsync("claimed.jpg", claimedUntil);

        // Altbestand: so hat der alte Worker (MarkAsProcessedAsync) die Metadaten geschrieben
        var legacyUserId = Guid.NewGuid();
        await Container.GetBlobClient("legacy.jpg").UploadAsync(new BinaryData(new byte[] { 3 }), new BlobUploadOptions
        {
            Metadata = new Dictionary<string, string>
            {
                ["userId"] = legacyUserId.ToString(),
                ["processedAt"] = "2026-01-01T00:00:00.0000000+00:00",
            },
        });

        var images = (await repository.ListImagesAsync()).OrderBy(image => image.ImageName).ToArray();

        Assert.Equal(["claimed.jpg", "legacy.jpg", "new.jpg"], images.Select(image => image.ImageName));

        Assert.Equal(1, images[0].Attempts);
        Assert.Equal(claimedUntil, images[0].ClaimedUntilUtc);
        Assert.False(images[0].LegacyProcessed);

        Assert.True(images[1].LegacyProcessed);
        Assert.Equal(0, images[1].Attempts);
        Assert.Null(images[1].ClaimedUntilUtc);

        Assert.Equal(0, images[2].Attempts);
        Assert.Null(images[2].ClaimedUntilUtc);
        Assert.False(images[2].LegacyProcessed);
        Assert.All(images, image => Assert.NotEqual(DateTimeOffset.MinValue, image.LastModified));

        // die Umwandlung des Altbestands braucht den Besitzer
        var (stream, owner) = await repository.GetImageAsync("legacy.jpg");
        await using (stream)
        {
            Assert.Equal(legacyUserId, owner);
        }
    }

    [AzuriteFact]
    public async Task Claim_of_a_legacy_blob_keeps_the_legacy_flag_and_owner()
    {
        var repository = new AzureStorageAnalysisImageRepository(blobServiceClient);
        var userId = Guid.NewGuid();
        await Container.GetBlobClient("legacy.jpg").UploadAsync(new BinaryData(new byte[] { 3 }), new BlobUploadOptions
        {
            Metadata = new Dictionary<string, string>
            {
                ["userId"] = userId.ToString(),
                ["processedAt"] = "2026-01-01T00:00:00.0000000+00:00",
            },
        });

        await repository.ClaimAsync("legacy.jpg", new DateTimeOffset(2026, 11, 4, 12, 10, 0, TimeSpan.Zero));

        var image = Assert.Single(await repository.ListImagesAsync());
        Assert.True(image.LegacyProcessed);
        Assert.Equal(1, image.Attempts);
        var (stream, owner) = await repository.GetImageAsync("legacy.jpg");
        await using (stream)
        {
            Assert.Equal(userId, owner);
        }
    }

    [AzuriteFact]
    public async Task Delete_removes_the_blob()
    {
        var repository = new AzureStorageAnalysisImageRepository(blobServiceClient);
        await repository.UploadImageAsync("a.jpg", new MemoryStream([1]), Guid.NewGuid());

        await repository.DeleteImageAsync("a.jpg");

        Assert.Empty(await repository.ListImagesAsync());
    }

    // Ablauf des Workers gegen das Azure-Repository: Claim → Liste → nach 3 Versuchen Aufgeben → Löschen
    [AzuriteFact]
    public async Task Worker_claims_three_times_then_gives_up_and_converts_legacy_blobs_at_once()
    {
        var repository = new AzureStorageAnalysisImageRepository(blobServiceClient);
        await repository.UploadImageAsync("a.jpg", new MemoryStream([1]), Guid.NewGuid());
        await Container.GetBlobClient("legacy.jpg").UploadAsync(new BinaryData(new byte[] { 3 }), new BlobUploadOptions
        {
            Metadata = new Dictionary<string, string>
            {
                ["userId"] = Guid.NewGuid().ToString(),
                ["processedAt"] = "2026-01-01T00:00:00.0000000+00:00",
            },
        });

        var broker = Substitute.For<IMessageBroker>();
        var failedHandler = Substitute.For<IFailedAnalysisImageHandler>();
        // wie FailedAnalysisImageHandler: leerer Analyse-Eintrag (hier ausgelassen), dann Quellbild löschen
        failedHandler.HandleAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(call => repository.DeleteImageAsync(call.Arg<string>(), call.Arg<CancellationToken>()));
        var scopeFactory = new ServiceCollection()
            .AddScoped(_ => failedHandler)
            .BuildServiceProvider()
            .GetRequiredService<IServiceScopeFactory>();
        var time = new SettableTimeProvider(new DateTimeOffset(2026, 11, 4, 12, 0, 0, TimeSpan.Zero));
        var worker = new AnalyzeBillWorker(NullLogger<AnalyzeBillWorker>.Instance, repository, broker, scopeFactory, time);

        // 1. Durchlauf: Altbestand sofort aufgegeben, neues Bild beansprucht und veröffentlicht
        await worker.PollAndProcessAsync(CancellationToken.None);
        await failedHandler.Received(1).HandleAsync("legacy.jpg", Arg.Any<CancellationToken>());
        Assert.Equal(["a.jpg"], (await repository.ListImagesAsync()).Select(image => image.ImageName));

        // noch beansprucht: kein weiterer Versuch
        time.Now += TimeSpan.FromMinutes(5);
        await worker.PollAndProcessAsync(CancellationToken.None);
        await broker.Received(1).PublishMessageAsync(Arg.Is<AnalyzeBillMessageV1>(m => m.ImageName == "a.jpg"), Arg.Any<CancellationToken>());

        // Versuche 2 und 3 nach Ablauf des Claims
        for (var attempt = 2; attempt <= 3; attempt++)
        {
            time.Now += AnalyzeBillWorker.ClaimDuration;
            await worker.PollAndProcessAsync(CancellationToken.None);
            Assert.Equal(attempt, Assert.Single(await repository.ListImagesAsync()).Attempts);
        }
        await broker.Received(3).PublishMessageAsync(Arg.Any<AnalyzeBillMessageV1>(), Arg.Any<CancellationToken>());

        // 4. Durchlauf: Obergrenze erreicht → aufgeben, Quellbild weg
        time.Now += AnalyzeBillWorker.ClaimDuration;
        await worker.PollAndProcessAsync(CancellationToken.None);
        await failedHandler.Received(1).HandleAsync("a.jpg", Arg.Any<CancellationToken>());
        await broker.Received(3).PublishMessageAsync(Arg.Any<AnalyzeBillMessageV1>(), Arg.Any<CancellationToken>());
        Assert.Empty(await repository.ListImagesAsync());
    }

    private sealed class SettableTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = now;

        public override DateTimeOffset GetUtcNow() => Now;
    }

    private static async Task<bool> IsReachableAsync()
    {
        try
        {
            using var client = new TcpClient();
            var connect = client.ConnectAsync("127.0.0.1", 10000);
            return await Task.WhenAny(connect, Task.Delay(500)) == connect && client.Connected;
        }
        catch (SocketException)
        {
            return false;
        }
    }
}
