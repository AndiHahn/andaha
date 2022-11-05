using Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;
using Azure.Storage.Blobs;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepository;

internal class AzureStorageImageRepository : IImageRepository
{
    private readonly IBlobStorageService blobStorageService;
    private readonly string folderName = "bills";

    public AzureStorageImageRepository(BlobServiceClient blobServiceClient)
    {
        this.blobStorageService = new BlobStorageService(blobServiceClient, "images");
    }

    public Task<Stream> GetImageStreamAsync(string name, CancellationToken cancellationToken)
    {
        string blobPath = GetBlobPath(name);

        return this.blobStorageService.GetBlobContentAsync(blobPath, cancellationToken);
    }

    public Task UploadImageAsync(string name, Stream imageStream, CancellationToken cancellationToken)
    {
        string blobPath = GetBlobPath(name);

        return this.blobStorageService.UpdateBlobContentAsync(blobPath, imageStream, cancellationToken);
    }

    public Task DeleteImageAsync(string name, CancellationToken cancellationToken)
    {
        string blobPath = GetBlobPath(name);

        return this.blobStorageService.DeleteDocumentAsync(blobPath, cancellationToken);
    }

    private string GetBlobPath(string name)
    {
        return Path.Combine(this.folderName, name);
    }
}
