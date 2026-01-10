using Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepository;

internal class AzureStorageImageRepository(BlobServiceClient blobServiceClient) : IImageRepository
{
    private readonly IBlobStorageService imageBlobStorageService = new BlobStorageService(blobServiceClient, "images");
    private readonly IBlobStorageService analysisBlobStorageService = new BlobStorageService(blobServiceClient, "analysis");
    private readonly string imagesFolderName = "bills";
    private readonly string analysisFolderName = "analysis";

    public Task<Stream> GetImageStreamAsync(string name, CancellationToken ct = default)
    {
        string blobPath = GetImagesBlobPath(name);

        return this.imageBlobStorageService.GetBlobContentAsync(blobPath, ct);
    }

    public async Task<(Stream Image, Guid UserId)> GetAnalysisImageAsync(string name, CancellationToken ct = default)
    {
        string blobPath = GetAnalysisBlobPath(name);

        var blobClient = blobServiceClient.GetBlobContainerClient("analysis").GetBlobClient(blobPath);

        var properties = await blobClient.GetPropertiesAsync(cancellationToken: ct);
        using var stream = await blobClient.OpenReadAsync(cancellationToken: ct);

        if (!properties.Value.Metadata.TryGetValue("userId", out var userId))
        {
            throw new InvalidOperationException("UserId does not exist in file metadata.");
        }

        return (stream, new Guid(userId));
    }

    public Task UploadImageAsync(string name, Stream imageStream, CancellationToken ct = default)
    {
        string blobPath = GetImagesBlobPath(name);

        return this.imageBlobStorageService.UpdateBlobContentAsync(blobPath, imageStream, ct: ct);
    }

    public Task UploadImageForAnalysisAsync(string name, Stream imageStream, Guid userId, CancellationToken ct = default)
    {
        string blobPath = GetAnalysisBlobPath(name);

        var metadata = new Dictionary<string, string>
        {
            { "userId", userId.ToString() }
        };

        var options = new BlobUploadOptions
        {
            Metadata = metadata,
        };

        return this.analysisBlobStorageService.UpdateBlobContentAsync(blobPath, imageStream, options, ct: ct);
    }

    public Task DeleteImageAsync(string name, CancellationToken ct = default)
    {
        string blobPath = GetImagesBlobPath(name);

        return this.imageBlobStorageService.DeleteDocumentAsync(blobPath, ct);
    }

    public async Task<IReadOnlyCollection<ImageMetadata>> ListIAnalyzeImagesAsync(CancellationToken ct = default)
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

    private string GetImagesBlobPath(string name) => Path.Combine(this.imagesFolderName, name);

    private string GetAnalysisBlobPath(string name) => Path.Combine(this.analysisFolderName, name);
}
