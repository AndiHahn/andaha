namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

internal interface IImageRepository
{
    Task<Stream> GetImageStreamAsync(string name, CancellationToken ct = default);

    Task UploadImageAsync(string name, Stream imageStream, CancellationToken ct = default);

    Task DeleteImageAsync(string name, CancellationToken ct = default);
}
