namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

public interface IAnalysisImageRepository
{
    Task<(Stream Image, Guid UserId)> GetImageAsync(string name, CancellationToken ct = default);

    Task UploadImageAsync(string name, Stream imageStream, Guid userId, CancellationToken ct = default);

    Task DeleteImageAsync(string name, CancellationToken ct = default);

    Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default);

    Task MarkAsProcessedAsync(string name, CancellationToken ct = default);
}
