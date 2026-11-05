namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

/// <summary>
/// Metadata written together with an analysis image in one call (US-0009).
/// A claim written here protects the image from the <c>AnalyzeBillWorker</c> from the very first moment,
/// because <see cref="IAnalysisImageRepository.ClaimAsync"/> is not atomic.
/// </summary>
public sealed record AnalysisUploadOptions
{
    /// <summary>Uploaded through the app; shown under "In Arbeit".</summary>
    public const string AppOrigin = "app";

    /// <summary>Copied over from the NAS folder; not shown under "In Arbeit".</summary>
    public const string NasOrigin = "nas";

    /// <summary>
    /// Kept as its own entry, because Azure changes <c>Last-Modified</c> on every metadata write (claim).
    /// </summary>
    public required DateTimeOffset UploadedAtUtc { get; init; }

    public required string Origin { get; init; }

    /// <summary>Claim written with the upload, or <c>null</c> for an unclaimed image.</summary>
    public DateTimeOffset? ClaimedUntilUtc { get; init; }

    /// <summary>Analysis attempts already counted with the upload (the immediate attempt counts as 1).</summary>
    public int Attempts { get; init; }
}
