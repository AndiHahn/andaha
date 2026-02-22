using Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;
using Azure.Storage.Blobs;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

internal class AzureStorageImageRepository(BlobServiceClient blobServiceClient) : IImageRepository
{
    private readonly IBlobStorageService imageBlobStorageService = new BlobStorageService(blobServiceClient, "images");
    private readonly string imagesFolderName = "bills";

    public Task<Stream> GetImageStreamAsync(string name, CancellationToken ct = default)
    {
        string blobPath = GetImagesBlobPath(name);

        return this.imageBlobStorageService.GetBlobContentAsync(blobPath, ct);
    }

    public Task UploadImageAsync(string name, Stream imageStream, CancellationToken ct = default)
    {
        string blobPath = GetImagesBlobPath(name);

        return this.imageBlobStorageService.UpdateBlobContentAsync(blobPath, imageStream, ct: ct);
    }

    public Task DeleteImageAsync(string name, CancellationToken ct = default)
    {
        string blobPath = GetImagesBlobPath(name);

        return this.imageBlobStorageService.DeleteDocumentAsync(blobPath, ct);
    }

    private string GetImagesBlobPath(string name) => Path.Combine(this.imagesFolderName, name);
}
