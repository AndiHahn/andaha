namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

public interface IAnalysisImageRepository
{
    Task<(Stream Image, Guid UserId)> GetImageAsync(string name, CancellationToken ct = default);

    Task UploadImageAsync(string name, Stream imageStream, Guid userId, CancellationToken ct = default);

    Task DeleteImageAsync(string name, CancellationToken ct = default);

    Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default);

    /// <summary>
    /// Records an analysis attempt: increments <see cref="ImageMetadata.Attempts"/> and sets
    /// <see cref="ImageMetadata.ClaimedUntilUtc"/> to <paramref name="claimedUntilUtc"/>.
    /// </summary>
    Task ClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default);
}
