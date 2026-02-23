using Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

public class AzureStorageAnalysisImageRepository(BlobServiceClient blobServiceClient) : IAnalysisImageRepository
{
    private readonly IBlobStorageService analysisBlobStorageService = new BlobStorageService(blobServiceClient, "analysis");

    public async Task<(Stream Image, Guid UserId)> GetImageAsync(string name, CancellationToken ct = default)
    {
        var blobClient = blobServiceClient.GetBlobContainerClient("analysis").GetBlobClient(name);

        var properties = await blobClient.GetPropertiesAsync(cancellationToken: ct);
        using var stream = await blobClient.OpenReadAsync(cancellationToken: ct);

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
        var allBlobs = await analysisBlobStorageService.ListBlobsAsync(ct: ct);

        return allBlobs
            .Select(blob => new ImageMetadata
            {
                ImageName = Path.GetFileName(blob.Name),
                LastModified = blob.Properties.LastModified ?? blob.Properties.CreatedOn ?? DateTimeOffset.MinValue,
            })
            .ToArray();
    }

    public async Task DeleteImageAsync(string name, CancellationToken ct = default)
    {
        await this.analysisBlobStorageService.DeleteDocumentAsync(name, ct);
    }
}
