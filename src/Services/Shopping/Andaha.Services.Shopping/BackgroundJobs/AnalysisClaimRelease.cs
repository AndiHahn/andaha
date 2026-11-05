using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

namespace Andaha.Services.Shopping.BackgroundJobs;

internal static class AnalysisClaimRelease
{
    /// <summary>
    /// Releases the claim after a failed attempt, so the next worker run retries the image. A failing release is
    /// only logged: the claim runs out by itself, and the caller's original error must not be replaced.
    /// </summary>
    public static async Task TryReleaseClaimAsync(this IAnalysisImageRepository imageRepository, string imageName, ILogger logger)
    {
        try
        {
            await imageRepository.ReleaseClaimAsync(imageName, CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not release the claim of image '{ImageName}'; it expires by itself.", imageName);
        }
    }
}
