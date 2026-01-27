using System.Text.Json;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

internal class FileSystemImageRepository : IImageRepository
{
    private readonly string imagesFilePath = "images";
    private readonly string analyzeFilePath = "analyze";

    public FileSystemImageRepository()
    {
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

    public Task UploadImageAsync(string name, Stream imageStream, CancellationToken ct = default)
    {
        string filePath = this.GetImagePath(name);

        var imageBytes = ReadStreamToBytes(imageStream);

        return File.WriteAllBytesAsync(filePath, imageBytes, ct);
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

        File.Delete(filePath);

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

    private string GetImagePath(string name) => Path.Combine(this.imagesFilePath, name);

    private string GetAnalyzeFilePath(string name) => Path.Combine(this.analyzeFilePath, name);

    private string GetMetadataFilePath(string name) => Path.Combine(this.analyzeFilePath, $"{name}.metadata.json");

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
