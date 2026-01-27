using Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;
using Azure.Storage.Blobs;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Nas;

public class AzureStorageNasImageRepository(BlobServiceClient blobServiceClient) : INasImageRepository
{
    private const string blobContainerName = "nas";

    private readonly IBlobStorageService blobStorageService = new BlobStorageService(blobServiceClient, blobContainerName);

    public async Task<(Stream Image, Guid UserId)> GetImageAsync(string blobPath, CancellationToken ct = default)
    {
        var blobClient = blobServiceClient.GetBlobContainerClient(blobContainerName).GetBlobClient(blobPath);

        var userId = GetUserIdFromPath(blobPath);

        using var stream = await blobClient.OpenReadAsync(cancellationToken: ct);

        return (stream, userId);
    }

    public async Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default)
    {
        var allBlobs = await blobStorageService.ListBlobsAsync(ct: ct);

        return allBlobs
            .Select(blob => new ImageMetadata
            {
                ImageName = Path.GetFileName(blob.Name),
                LastModified = blob.Properties.LastModified ?? blob.Properties.CreatedOn ?? DateTimeOffset.MinValue,
            })
            .ToArray();
    }

    private static Guid GetUserIdFromPath(string path)
    {
        var normalized = path.Replace('\\', '/').Trim('/');
        var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);

        // Find first segment that is a GUID (robust if you have nested folders)
        foreach (var segment in segments)
        {
            if (Guid.TryParse(segment, out var userId))
            {
                return userId;
            }
        }

        throw new InvalidOperationException($"Could not extract UserId from blob path: {path}");
    }
}
