namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

internal static class ImageFileTypeDetection
{
    /// <summary>Detects the type of a seekable stream (position is kept) and logs a warning if it is unknown.</summary>
    public static async Task<ImageFileType> DetectOrWarnAsync(this ILogger logger, Stream seekableStream, string subject, CancellationToken ct)
    {
        var fileType = await ImageFileType.DetectAsync(seekableStream, ct);

        if (fileType == ImageFileType.Unknown)
        {
            logger.LogWarning("The file type of the image for {Subject} is unknown. Storing it as '{Extension}'.", subject, fileType.Extension);
        }

        return fileType;
    }
}
