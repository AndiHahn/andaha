using Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

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

    public Task UploadImageAsync(string name, Stream imageStream, string? contentType, CancellationToken ct = default)
    {
        string blobPath = GetImagesBlobPath(name);

        var options = new BlobUploadOptions();
        if (!string.IsNullOrWhiteSpace(contentType))
        {
            options.HttpHeaders = new BlobHttpHeaders { ContentType = contentType };
        }

        return this.imageBlobStorageService.UpdateBlobContentAsync(blobPath, imageStream, options, ct);
    }

    public async Task<bool> UploadImageIfAbsentAsync(string name, Stream imageStream, string? contentType, CancellationToken ct = default)
    {
        string blobPath = GetImagesBlobPath(name);

        var options = new BlobUploadOptions
        {
            Conditions = new BlobRequestConditions { IfNoneMatch = ETag.All }
        };
        if (!string.IsNullOrWhiteSpace(contentType))
        {
            options.HttpHeaders = new BlobHttpHeaders { ContentType = contentType };
        }

        try
        {
            await this.imageBlobStorageService.UpdateBlobContentAsync(blobPath, imageStream, options, ct);

            return true;
        }
        catch (RequestFailedException ex) when (ex.Status is 409 or 412
            || ex.ErrorCode is "BlobAlreadyExists" or "ConditionNotMet")
        {
            return false;
        }
    }

    public Task CopyImageAsync(string sourceName, string targetName, CancellationToken ct = default)
    {
        return this.imageBlobStorageService.CopyBlobAsync(GetImagesBlobPath(sourceName), GetImagesBlobPath(targetName), ct);
    }

    public Task DeleteImageAsync(string name, CancellationToken ct = default)
    {
        string blobPath = GetImagesBlobPath(name);

        return this.imageBlobStorageService.DeleteDocumentIfExistsAsync(blobPath, ct);
    }

    private string GetImagesBlobPath(string name) => $"{this.imagesFolderName}/{name}";
}
