namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

/// <summary>
/// An uploaded image that is not processed yet. <see cref="State"/> is <c>queued</c> or <c>analyzing</c> (claim active).
/// </summary>
public record PendingAnalysisDto(string Id, DateTimeOffset UploadedAt, string State)
{
    public const string Queued = "queued";

    public const string Analyzing = "analyzing";
}
