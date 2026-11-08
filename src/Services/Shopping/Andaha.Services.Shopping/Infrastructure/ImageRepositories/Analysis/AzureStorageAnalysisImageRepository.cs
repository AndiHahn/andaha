using System.Globalization;
using Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

public class AzureStorageAnalysisImageRepository(BlobServiceClient blobServiceClient) : IAnalysisImageRepository
{
    private const string UserIdKey = "userId";
    private const string AttemptsKey = "attempts";
    private const string ClaimedUntilKey = "claimedUntil";
    private const string UploadedAtKey = "uploadedAt";
    private const string OriginKey = "origin";
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

    public Task UploadImageAsync(string name, Stream imageStream, Guid userId, AnalysisUploadOptions options, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(options);

        string fileName = Path.GetFileName(name);

        // Everything goes into the Put Blob call, so the claim exists from the first moment on.
        var metadata = new Dictionary<string, string>
        {
            { UserIdKey, userId.ToString() },
            { UploadedAtKey, options.UploadedAtUtc.ToString("O", CultureInfo.InvariantCulture) },
            { OriginKey, options.Origin },
            { AttemptsKey, options.Attempts.ToString(CultureInfo.InvariantCulture) },
        };

        if (options.ClaimedUntilUtc is { } claimedUntil)
        {
            metadata[ClaimedUntilKey] = claimedUntil.ToString("O", CultureInfo.InvariantCulture);
        }

        var uploadOptions = new BlobUploadOptions
        {
            Metadata = metadata,
        };

        return this.analysisBlobStorageService.UpdateBlobContentAsync(fileName, imageStream, uploadOptions, ct: ct);
    }

    public async Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default)
    {
        var containerClient = blobServiceClient.GetBlobContainerClient("analysis");
        var result = new List<ImageMetadata>();

        await foreach (var blobItem in containerClient.GetBlobsAsync(
            traits: BlobTraits.Metadata,
            states: BlobStates.None,
            prefix: null,
            cancellationToken: ct))
        {
            result.Add(ToImageMetadata(
                blobItem.Name,
                blobItem.Properties.LastModified ?? blobItem.Properties.CreatedOn ?? DateTimeOffset.MinValue,
                blobItem.Metadata ?? new Dictionary<string, string>()));
        }

        return result;
    }

    public async Task<ImageMetadata?> GetMetadataAsync(string name, CancellationToken ct = default)
    {
        var blobClient = blobServiceClient.GetBlobContainerClient("analysis").GetBlobClient(name);

        try
        {
            var properties = (await blobClient.GetPropertiesAsync(cancellationToken: ct)).Value;

            return ToImageMetadata(name, properties.LastModified, properties.Metadata ?? new Dictionary<string, string>());
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }

    public async Task ExtendClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default)
    {
        var blobClient = blobServiceClient.GetBlobContainerClient("analysis").GetBlobClient(name);
        var metadata = await ReadMetadataAsync(blobClient, ct);

        metadata[ClaimedUntilKey] = claimedUntilUtc.ToString("O", CultureInfo.InvariantCulture);

        await blobClient.SetMetadataAsync(metadata, cancellationToken: ct);
    }

    private static ImageMetadata ToImageMetadata(string blobName, DateTimeOffset lastModified, IDictionary<string, string> metadata)
        => new()
        {
            ImageName = Path.GetFileName(blobName),
            LastModified = lastModified,
            UserId = ReadUserId(metadata),
            UploadedAtUtc = ReadTimestamp(metadata, UploadedAtKey),
            Origin = ReadValue(metadata, OriginKey),
            Attempts = ReadAttempts(metadata),
            ClaimedUntilUtc = ReadTimestamp(metadata, ClaimedUntilKey),
            LegacyProcessed = ReadValue(metadata, LegacyProcessedAtKey) is not null,
        };

    public async Task DeleteImageAsync(string name, CancellationToken ct = default)
    {
        await this.analysisBlobStorageService.DeleteDocumentAsync(name, ct);
    }

    public async Task ClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default)
    {
        var blobClient = blobServiceClient.GetBlobContainerClient("analysis").GetBlobClient(name);
        var metadata = await ReadMetadataAsync(blobClient, ct);

        metadata[AttemptsKey] = (ReadAttempts(metadata) + 1).ToString(CultureInfo.InvariantCulture);
        metadata[ClaimedUntilKey] = claimedUntilUtc.ToString("O", CultureInfo.InvariantCulture);

        await blobClient.SetMetadataAsync(metadata, cancellationToken: ct);
    }

    public async Task ReleaseClaimAsync(string name, CancellationToken ct = default)
    {
        var blobClient = blobServiceClient.GetBlobContainerClient("analysis").GetBlobClient(name);
        var metadata = await ReadMetadataAsync(blobClient, ct);

        metadata.Remove(ClaimedUntilKey);

        await blobClient.SetMetadataAsync(metadata, cancellationToken: ct);
    }

    // SetMetadataAsync replaces all metadata, so the existing entries (userId, uploadedAt, ...) are carried over.
    private static async Task<Dictionary<string, string>> ReadMetadataAsync(BlobClient blobClient, CancellationToken ct)
    {
        var properties = await blobClient.GetPropertiesAsync(cancellationToken: ct);

        return new Dictionary<string, string>(
            properties.Value.Metadata ?? new Dictionary<string, string>(),
            StringComparer.OrdinalIgnoreCase);
    }

    private static int ReadAttempts(IDictionary<string, string> metadata)
        => int.TryParse(ReadValue(metadata, AttemptsKey), NumberStyles.Integer, CultureInfo.InvariantCulture, out var attempts)
            ? attempts
            : 0;

    private static DateTimeOffset? ReadTimestamp(IDictionary<string, string> metadata, string key)
        => DateTimeOffset.TryParse(ReadValue(metadata, key), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var timestamp)
            ? timestamp
            : null;

    private static Guid? ReadUserId(IDictionary<string, string> metadata)
        => Guid.TryParse(ReadValue(metadata, UserIdKey), out var userId) ? userId : null;

    // Metadata names are case-insensitive in Blob Storage, the listed dictionary is not.
    private static string? ReadValue(IDictionary<string, string> metadata, string key)
        => metadata.FirstOrDefault(entry => string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)).Value;
}
