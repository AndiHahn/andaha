namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Nas;

public interface INasImageRepository
{
    Task<(Stream Image, Guid UserId)> GetImageAsync(string name, CancellationToken ct = default);

    Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default);
}
