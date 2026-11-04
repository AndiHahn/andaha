using System.Globalization;
using Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

public class AzureStorageAnalysisImageRepository(BlobServiceClient blobServiceClient) : IAnalysisImageRepository
{
    private const string AttemptsKey = "attempts";
    private const string ClaimedUntilKey = "claimedUntil";
    private const string LegacyProcessedAtKey = "processedAt";

    private readonly IBlobStorageService analysisBlobStorageService = new BlobStorageService(blobServiceClient, "analysis");

    public async Task<(Stream Image, Guid UserId)> GetImageAsync(string name, CancellationToken ct = default)
    {
        var blobClient = blobServiceClient.GetBlobContainerClient("analysis").GetBlobClient(name);

        var properties = await blobClient.GetPropertiesAsync(cancellationToken: ct);
        var stream = await blobClient.OpenReadAsync(cancellationToken: ct);

        if (!properties.Value.Metadata.TryGetValue("userId", out var userId))
        {
            throw new InvalidOperationException("UserId does not exist in file metadata.");
        }

        return (stream, new Guid(userId));
    }

    public Task UploadImageAsync(string name, Stream imageStream, Guid userId, CancellationToken ct = default)
    {
        string fileName = Path.GetFileName(name);

        var metadata = new Dictionary<string, string>
        {
            { "userId", userId.ToString() }
        };

        var options = new BlobUploadOptions
        {
            Metadata = metadata,
        };

        return this.analysisBlobStorageService.UpdateBlobContentAsync(fileName, imageStream, options, ct: ct);
    }

    public async Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default)
    {
        var containerClient = blobServiceClient.GetBlobContainerClient("analysis");
        var result = new List<ImageMetadata>();

        await foreach (var blobItem in containerClient.GetBlobsAsync(
            traits: BlobTraits.Metadata,
            cancellationToken: ct))
        {
            var metadata = blobItem.Metadata ?? new Dictionary<string, string>();

            result.Add(new ImageMetadata
            {
                ImageName = Path.GetFileName(blobItem.Name),
                LastModified = blobItem.Properties.LastModified ?? blobItem.Properties.CreatedOn ?? DateTimeOffset.MinValue,
                Attempts = ReadAttempts(metadata),
                ClaimedUntilUtc = ReadClaimedUntil(metadata),
                LegacyProcessed = metadata.ContainsKey(LegacyProcessedAtKey),
            });
        }

        return result;
    }

    public async Task DeleteImageAsync(string name, CancellationToken ct = default)
    {
        await this.analysisBlobStorageService.DeleteDocumentAsync(name, ct);
    }

    public async Task ClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default)
    {
        var blobClient = blobServiceClient.GetBlobContainerClient("analysis").GetBlobClient(name);

        var properties = await blobClient.GetPropertiesAsync(cancellationToken: ct);

        // SetMetadataAsync replaces all metadata, so the existing entries (userId, ...) are carried over.
        var metadata = new Dictionary<string, string>(
            properties.Value.Metadata ?? new Dictionary<string, string>(),
            StringComparer.OrdinalIgnoreCase);

        metadata[AttemptsKey] = (ReadAttempts(metadata) + 1).ToString(CultureInfo.InvariantCulture);
        metadata[ClaimedUntilKey] = claimedUntilUtc.ToString("O", CultureInfo.InvariantCulture);

        await blobClient.SetMetadataAsync(metadata, cancellationToken: ct);
    }

    private static int ReadAttempts(IDictionary<string, string> metadata)
        => metadata.TryGetValue(AttemptsKey, out var text) &&
           int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out var attempts)
            ? attempts
            : 0;

    private static DateTimeOffset? ReadClaimedUntil(IDictionary<string, string> metadata)
        => metadata.TryGetValue(ClaimedUntilKey, out var text) &&
           DateTimeOffset.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var claimedUntil)
            ? claimedUntil
            : null;
}
