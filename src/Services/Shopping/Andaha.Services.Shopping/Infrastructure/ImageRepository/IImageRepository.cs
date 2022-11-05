namespace Andaha.Services.Shopping.Infrastructure.ImageRepository;

internal interface IImageRepository
{
    Task<Stream> GetImageStreamAsync(string name, CancellationToken cancellationToken);

    Task UploadImageAsync(string name, Stream imageStream, CancellationToken cancellationToken);

    Task DeleteImageAsync(string name, CancellationToken cancellationToken);
}
