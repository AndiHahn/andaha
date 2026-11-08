using Azure.Storage.Blobs.Models;

namespace Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;

internal interface IBlobStorageService
{
    Task DeleteDocumentAsync(string blobName, CancellationToken ct = default);
    Task<Stream> GetBlobContentAsync(string blobName, CancellationToken ct = default);
    Task UpdateBlobContentAsync(string blobName, Stream content, BlobUploadOptions? options = null, CancellationToken ct = default);
    /// <summary>Deletes the blob; a missing blob is not an error. Returns whether it existed.</summary>
    Task<bool> DeleteDocumentIfExistsAsync(string blobName, CancellationToken ct = default);

    /// <summary>
    /// Copies a blob within the container (download + upload with the account's credentials),
    /// overwriting the target and keeping the source content type.
    /// Throws <see cref="FileNotFoundException"/> if the source blob does not exist.
    /// </summary>
    Task CopyBlobAsync(string sourceBlobName, string targetBlobName, CancellationToken ct = default);

    Task<IEnumerable<BlobItem>> ListBlobsAsync(string? prefix = null, CancellationToken ct = default);
}
