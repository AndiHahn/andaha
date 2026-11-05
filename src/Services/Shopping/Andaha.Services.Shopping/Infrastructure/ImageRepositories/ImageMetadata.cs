namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories;

public record ImageMetadata
{
    public required string ImageName { get; set; }

    public required DateTimeOffset LastModified { get; set; }

    /// <summary>
    /// The uploading user from the <c>userId</c> metadata entry, or <c>null</c> when it is missing or invalid.
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Upload time from the <c>uploadedAt</c> metadata entry, or <c>null</c> for images uploaded before US-0009.
    /// </summary>
    public DateTimeOffset? UploadedAtUtc { get; set; }

    /// <summary>
    /// Where the image came from (<c>app</c> or <c>nas</c>), or <c>null</c> for images uploaded before US-0009.
    /// </summary>
    public string? Origin { get; set; }

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
