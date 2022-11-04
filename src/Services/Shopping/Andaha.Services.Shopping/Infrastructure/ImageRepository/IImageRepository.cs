namespace Andaha.Services.Shopping.Infrastructure.ImageRepository;

internal interface IImageRepository
{
    Task<byte[]?> GetImageAsync(string name, CancellationToken cancellationToken);

    Task UploadImageAsync(string name, byte[] image, CancellationToken cancellationToken);

    Task DeleteImageAsync(string name, CancellationToken cancellationToken);
}
