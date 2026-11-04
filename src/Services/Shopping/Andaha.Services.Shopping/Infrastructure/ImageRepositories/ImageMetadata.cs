namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories;

public record ImageMetadata
{
    public required string ImageName { get; set; }

    public required DateTimeOffset LastModified { get; set; }

    /// <summary>
    /// Number of times the image has been claimed for analysis.
    /// </summary>
    public int Attempts { get; set; }

    /// <summary>
    /// While this point in time lies in the future, an analysis attempt is in flight.
    /// </summary>
    public DateTimeOffset? ClaimedUntilUtc { get; set; }

    /// <summary>
    /// The image carries the legacy <c>processedAt</c> marker: it was published once but never cleaned up.
    /// </summary>
    public bool LegacyProcessed { get; set; }
}
