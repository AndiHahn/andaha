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
    /// Current metadata of one image, or <c>null</c> when the image no longer exists (already processed).
    /// Used to re-check claim and attempts right before acting on an image.
    /// </summary>
    Task<ImageMetadata?> GetMetadataAsync(string name, CancellationToken ct = default);

    /// <summary>
    /// Records an analysis attempt: increments <see cref="ImageMetadata.Attempts"/> and sets
    /// <see cref="ImageMetadata.ClaimedUntilUtc"/> to <paramref name="claimedUntilUtc"/>.
    /// </summary>
    Task ClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default);

    /// <summary>
    /// Moves an existing claim to <paramref name="claimedUntilUtc"/> without counting an attempt,
    /// e.g. when the immediate analysis starts on an image whose attempt the upload already counted.
    /// </summary>
    Task ExtendClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default);

    /// <summary>
    /// Ends the claim after a failed attempt, so the next worker run retries the image.
    /// <see cref="ImageMetadata.Attempts"/> and all other entries stay unchanged.
    /// </summary>
    Task ReleaseClaimAsync(string name, CancellationToken ct = default);
}
