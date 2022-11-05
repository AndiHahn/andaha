namespace Andaha.Services.Shopping.Infrastructure.AzureBlobStorage;

internal interface IBlobStorageService
{
    Task DeleteDocumentAsync(string blobName, CancellationToken cancellationToken);
    Task<Stream> GetBlobContentAsync(string blobName, CancellationToken cancellationToken);
    Task UpdateBlobContentAsync(string blobName, Stream content, CancellationToken cancellationToken);
}
