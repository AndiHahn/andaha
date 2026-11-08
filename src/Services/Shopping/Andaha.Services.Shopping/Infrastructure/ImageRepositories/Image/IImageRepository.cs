namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

internal interface IImageRepository
{
    Task<Stream> GetImageStreamAsync(string name, CancellationToken ct = default);

    /// <summary>Stores the image under <paramref name="name"/> (may contain '/'), overwriting an existing one.</summary>
    Task UploadImageAsync(string name, Stream imageStream, string? contentType, CancellationToken ct = default);

    /// <summary>
    /// Copies an image, overwriting an existing target and keeping the source content type.
    /// Throws <see cref="FileNotFoundException"/> if the source does not exist.
    /// </summary>
    Task CopyImageAsync(string sourceName, string targetName, CancellationToken ct = default);

    Task DeleteImageAsync(string name, CancellationToken ct = default);
}
