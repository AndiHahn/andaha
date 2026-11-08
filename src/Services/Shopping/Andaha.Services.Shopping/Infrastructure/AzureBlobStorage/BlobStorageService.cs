using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

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

    public async Task DeleteDocumentAsync(string blobName, CancellationToken ct = default)
    {
        var containerClient = GetContainerClient();

        var blobClient = containerClient.GetBlobClient(blobName);

        await blobClient.DeleteAsync(cancellationToken: ct);
    }

    public async Task<bool> DeleteDocumentIfExistsAsync(string blobName, CancellationToken ct = default)
    {
        var blobClient = GetContainerClient().GetBlobClient(blobName);

        var response = await blobClient.DeleteIfExistsAsync(cancellationToken: ct);

        return response.Value;
    }

    public async Task CopyBlobAsync(string sourceBlobName, string targetBlobName, CancellationToken ct = default)
    {
        var containerClient = GetContainerClient();
        var sourceClient = containerClient.GetBlobClient(sourceBlobName);
        var targetClient = containerClient.GetBlobClient(targetBlobName);

        BlobDownloadStreamingResult download;
        try
        {
            download = (await sourceClient.DownloadStreamingAsync(cancellationToken: ct)).Value;
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            throw new FileNotFoundException($"Blob '{sourceBlobName}' does not exist.", sourceBlobName, ex);
        }

        using (download)
        {
            await targetClient.UploadAsync(
                download.Content,
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders { ContentType = download.Details.ContentType },
                    Conditions = new BlobRequestConditions(),
                },
                ct);
        }
    }

    public async Task<Stream> GetBlobContentAsync(string blobName, CancellationToken ct = default)
    {
        var containerClient = GetContainerClient();

        var blobClient = containerClient.GetBlobClient(blobName);

        return await blobClient.OpenReadAsync(cancellationToken: ct);
    }

    public async Task UpdateBlobContentAsync(
        string blobName,
        Stream content,
        BlobUploadOptions? options = null,
        CancellationToken ct = default)
    {
        var containerClient = GetContainerClient();

        var blobClient = containerClient.GetBlobClient(blobName);

        options ??= new BlobUploadOptions();

        // Set overwrite to true if no condition is set
        options.Conditions ??= new BlobRequestConditions();
        
        await blobClient.UploadAsync(
            content: content,
            options: options,
            ct);
    }

    public async Task<IEnumerable<BlobItem>> ListBlobsAsync(string? prefix = null, CancellationToken ct = default)
    {
        var containerClient = GetContainerClient();
        var results = new List<BlobItem>();

        await foreach (var blobItem in containerClient.GetBlobsAsync(
            traits: BlobTraits.Metadata,
            states: BlobStates.None,
            prefix: prefix,
            cancellationToken: ct))
        {
            results.Add(blobItem);
        }

        return results;
    }

    private BlobContainerClient GetContainerClient() => blobServiceClient.GetBlobContainerClient(containerName);
}
