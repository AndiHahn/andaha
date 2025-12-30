namespace Andaha.Services.Shopping.Infrastructure.ImageRepository;

internal interface IImageRepository
{
    Task<Stream> GetImageStreamAsync(string name, CancellationToken ct = default);

    Task<(Stream Image, Guid UserId)> GetAnalysisImageAsync(string name, CancellationToken ct = default);

    Task UploadImageAsync(string name, Stream imageStream, CancellationToken ct = default);

    Task UploadImageForAnalysisAsync(string name, Stream imageStream, Guid userId, CancellationToken ct = default);

    Task DeleteImageAsync(string name, CancellationToken ct = default);
}
