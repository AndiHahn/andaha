namespace Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;

/// <summary>
/// Answer to an upload for analysis (202). <paramref name="Id"/> is the image name; it comes back as
/// <c>sourceUploadId</c> on the bill or analyzed bill created from it (US-0009).
/// </summary>
public sealed record UploadBillForAnalysisResponse(string Id);
