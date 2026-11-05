namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill;

/// <summary>
/// Analyzes one image of the analysis repository and turns it into a bill or an analyzed bill (US-0009).
/// Shared by the immediate analysis after an upload, the <c>AnalyzeBillWorker</c> and the legacy pub/sub handler.
/// </summary>
internal interface IBillAnalysisProcessor
{
    /// <summary>
    /// Analyzes the image, creates a bill (plausible result) or an analyzed bill, both with
    /// <c>SourceUploadId = imageName</c>, and deletes the source image.
    /// Throws on failure; the caller releases the claim.
    /// </summary>
    Task ProcessAsync(string imageName, CancellationToken ct);
}
