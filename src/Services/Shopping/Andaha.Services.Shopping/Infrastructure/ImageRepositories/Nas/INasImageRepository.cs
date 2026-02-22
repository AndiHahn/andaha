namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Nas;

public interface INasImageRepository
{
    Task<(Stream Image, Guid UserId)> GetImageAsync(string filePath, CancellationToken ct = default);

    Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default);

    Task UploadImageAsync(string name, Guid userId, Stream imageStream, CancellationToken ct = default);
}
