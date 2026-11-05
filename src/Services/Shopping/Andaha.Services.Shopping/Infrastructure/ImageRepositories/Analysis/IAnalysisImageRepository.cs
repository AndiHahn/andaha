namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

public interface IAnalysisImageRepository
{
    Task<(Stream Image, Guid UserId)> GetImageAsync(string name, CancellationToken ct = default);

    /// <summary>
    /// Stores the image together with <c>userId</c> and all entries of <paramref name="options"/> in one call.
    /// </summary>
    Task UploadImageAsync(string name, Stream imageStream, Guid userId, AnalysisUploadOptions options, CancellationToken ct = default);

    Task DeleteImageAsync(string name, CancellationToken ct = default);

    Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default);

    /// <summary>
    /// Records an analysis attempt: increments <see cref="ImageMetadata.Attempts"/> and sets
    /// <see cref="ImageMetadata.ClaimedUntilUtc"/> to <paramref name="claimedUntilUtc"/>.
    /// </summary>
    Task ClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default);

    /// <summary>
    /// Ends the claim after a failed attempt, so the next worker run retries the image.
    /// <see cref="ImageMetadata.Attempts"/> and all other entries stay unchanged.
    /// </summary>
    Task ReleaseClaimAsync(string name, CancellationToken ct = default);
}
