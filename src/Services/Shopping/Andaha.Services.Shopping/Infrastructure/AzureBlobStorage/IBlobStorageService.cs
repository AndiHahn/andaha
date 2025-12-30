using Azure.Storage.Blobs.Models;

namespace Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;

internal interface IBlobStorageService
{
    Task DeleteDocumentAsync(string blobName, CancellationToken ct = default);
    Task<Stream> GetBlobContentAsync(string blobName, CancellationToken ct = default);
    Task UpdateBlobContentAsync(string blobName, Stream content, BlobUploadOptions? options = null, CancellationToken ct = default);
}
