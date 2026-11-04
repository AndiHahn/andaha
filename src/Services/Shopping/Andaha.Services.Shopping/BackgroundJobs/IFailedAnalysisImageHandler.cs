namespace Andaha.Services.Shopping.BackgroundJobs;

internal interface IFailedAnalysisImageHandler
{
    /// <summary>
    /// Turns an analysis image that could not be analysed into an empty analyzed bill of the image owner
    /// and removes it from the analysis repository.
    /// </summary>
    Task HandleAsync(string imageName, CancellationToken ct);
}
