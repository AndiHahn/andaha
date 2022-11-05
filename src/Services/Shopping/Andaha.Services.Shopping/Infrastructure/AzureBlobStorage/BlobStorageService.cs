using Azure.Storage.Blobs;

namespace Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;

internal class BlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient blobServiceClient;
    private readonly string containerName;

    public BlobStorageService(BlobServiceClient blobServiceClient, string containerName)
    {
        this.blobServiceClient = blobServiceClient;
        this.containerName = containerName;

        var containerClient = this.blobServiceClient.GetBlobContainerClient(containerName);
        containerClient.CreateIfNotExists(Azure.Storage.Blobs.Models.PublicAccessType.None);
    }

    public async Task DeleteDocumentAsync(string blobName, CancellationToken cancellationToken)
    {
        var containerClient = GetContainerClient();

        var blobClient = containerClient.GetBlobClient(blobName);

        await blobClient.DeleteAsync(cancellationToken: cancellationToken);
    }

    public async Task<Stream> GetBlobContentAsync(string blobName, CancellationToken cancellationToken)
    {
        var containerClient = GetContainerClient();

        var blobClient = containerClient.GetBlobClient(blobName);

        return await blobClient.OpenReadAsync(cancellationToken: cancellationToken);
    }

    public async Task UpdateBlobContentAsync(string blobName, Stream content, CancellationToken cancellationToken)
    {
        var containerClient = GetContainerClient();

        var blobClient = containerClient.GetBlobClient(blobName);

        await blobClient.UploadAsync(content, true, cancellationToken);
    }

    private BlobContainerClient GetContainerClient() => blobServiceClient.GetBlobContainerClient(containerName);
}
