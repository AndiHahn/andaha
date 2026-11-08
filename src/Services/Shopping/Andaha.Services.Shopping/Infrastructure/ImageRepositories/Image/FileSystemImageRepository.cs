using System.Text.Json;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

internal class FileSystemImageRepository : IImageRepository
{
    private readonly string imagesFilePath;
    private readonly string analyzeFilePath;

    public FileSystemImageRepository() : this(string.Empty)
    {
    }

    /// <param name="baseDirectory">Folder containing the "images" and "analyze" folders; empty means the working directory.</param>
    public FileSystemImageRepository(string baseDirectory)
    {
        this.imagesFilePath = Path.Combine(baseDirectory, "images");
        this.analyzeFilePath = Path.Combine(baseDirectory, "analyze");

        if (!Directory.Exists(this.imagesFilePath))
        {
            Directory.CreateDirectory(this.imagesFilePath);
        }

        if (!Directory.Exists(this.analyzeFilePath))
        {
            Directory.CreateDirectory(this.analyzeFilePath);
        }
    }

    public async Task<Stream> GetImageStreamAsync(string name, CancellationToken ct = default)
    {
        string filePath = this.GetImagePath(name);

        var imageBytes = await File.ReadAllBytesAsync(filePath, ct);

        return new MemoryStream(imageBytes);
    }

    public async Task<(Stream Image, Guid UserId)> GetAnalysisImageAsync(string name, CancellationToken ct = default)
    {
        string filePath = this.GetAnalyzeFilePath(name);
        string metadataFilePath = this.GetMetadataFilePath(name);

        var imageBytes = await File.ReadAllBytesAsync(filePath, ct);
        var userId = await ReadMetadataAsync(metadataFilePath, ct);

        return (new MemoryStream(imageBytes), userId);
    }

    // The content type cannot be stored on disk (local development only), so it is ignored here.
    public Task UploadImageAsync(string name, Stream imageStream, string? contentType, CancellationToken ct = default)
    {
        string filePath = this.GetImagePath(name);

        Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

        var imageBytes = ReadStreamToBytes(imageStream);

        return File.WriteAllBytesAsync(filePath, imageBytes, ct);
    }

    public async Task<bool> UploadImageIfAbsentAsync(string name, Stream imageStream, string? contentType, CancellationToken ct = default)
    {
        string filePath = this.GetImagePath(name);

        Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

        var imageBytes = ReadStreamToBytes(imageStream);

        try
        {
            await using var file = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
            await file.WriteAsync(imageBytes, ct);

            return true;
        }
        catch (IOException) when (File.Exists(filePath))
        {
            return false;
        }
    }

    public Task CopyImageAsync(string sourceName, string targetName, CancellationToken ct = default)
    {
        string sourcePath = this.GetImagePath(sourceName);
        string targetPath = this.GetImagePath(targetName);

        if (!File.Exists(sourcePath))
        {
            throw new FileNotFoundException($"Image '{sourceName}' does not exist.", sourcePath);
        }

        Directory.CreateDirectory(Path.GetDirectoryName(targetPath)!);

        File.Copy(sourcePath, targetPath, overwrite: true);

        return Task.CompletedTask;
    }

    public async Task UploadImageForAnalysisAsync(string name, Stream imageStream, Guid userId, CancellationToken ct = default)
    {
        string filePath = this.GetAnalyzeFilePath(name);
        string metadataFilePath = this.GetMetadataFilePath(name);

        var imageBytes = ReadStreamToBytes(imageStream);

        await File.WriteAllBytesAsync(filePath, imageBytes, ct);

        var metadata = new { userId = userId.ToString() };
        var metadataJson = JsonSerializer.Serialize(metadata);

        await File.WriteAllTextAsync(metadataFilePath, metadataJson, ct);
    }

    public Task DeleteImageAsync(string name, CancellationToken ct = default)
    {
        string filePath = this.GetImagePath(name);

        // File.Delete does not throw for a missing file (only for a missing directory).
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }

        return Task.CompletedTask;
    }

    public async Task<IReadOnlyCollection<ImageMetadata>> ListIAnalyzeImagesAsync(CancellationToken ct = default)
    {
        if (!Directory.Exists(analyzeFilePath))
        {
            return [];
        }

        var result = new List<ImageMetadata>();

        foreach (var filePath in Directory.EnumerateFiles(analyzeFilePath))
        {
            var fileName = Path.GetFileName(filePath);

            if (fileName.EndsWith("metadata.json", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var fileInfo = new FileInfo(filePath);
            DateTimeOffset lastModified;
            if (fileInfo.LastWriteTimeUtc != DateTime.MinValue)
            {
                lastModified = new DateTimeOffset(fileInfo.LastWriteTimeUtc, TimeSpan.Zero);
            }
            else
            {
                lastModified = new DateTimeOffset(fileInfo.CreationTimeUtc, TimeSpan.Zero);
            }

            result.Add(new ImageMetadata
            {
                ImageName = fileName,
                LastModified = lastModified
            });
        }

        return result;
    }

    private async static Task<Guid> ReadMetadataAsync(string metadataPath, CancellationToken ct)
    {
        if (!File.Exists(metadataPath))
        {
            return Guid.Empty;
        }

        try
        {
            var json = await File.ReadAllTextAsync(metadataPath, ct);
            using var jsonDoc = JsonDocument.Parse(json);
            var root = jsonDoc.RootElement;

            if (root.TryGetProperty("userId", out var userIdElement) &&
                Guid.TryParse(userIdElement.GetString(), out var userId))
            {
                return userId;
            }

            return Guid.Empty;
        }
        catch
        {
            return Guid.Empty;
        }
    }

    private string GetImagePath(string name) => Path.Combine(this.imagesFilePath, name.Replace('/', Path.DirectorySeparatorChar));

    private string GetAnalyzeFilePath(string name) => Path.Combine(this.analyzeFilePath, name);

    private string GetMetadataFilePath(string name) => Path.Combine(this.analyzeFilePath, $"{name}.metadata.json");

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
