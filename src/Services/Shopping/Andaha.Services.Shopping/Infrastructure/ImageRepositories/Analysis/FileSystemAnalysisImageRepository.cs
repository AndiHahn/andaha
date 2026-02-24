using System.Text.Json;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

public class FileSystemAnalysisImageRepository : IAnalysisImageRepository
{
    private readonly string analyzeFilePath = "analyze";

    public FileSystemAnalysisImageRepository()
    {
        if (!Directory.Exists(this.analyzeFilePath))
        {
            Directory.CreateDirectory(this.analyzeFilePath);
        }
    }

    public async Task<(Stream Image, Guid UserId)> GetImageAsync(string name, CancellationToken ct = default)
    {
        string filePath = this.GetFilePath(name);
        string metadataFilePath = this.GetMetadataFilePath(name);

        var imageBytes = await File.ReadAllBytesAsync(filePath, ct);
        var userId = await ReadMetadataAsync(metadataFilePath, ct);

        return (new MemoryStream(imageBytes), userId);
    }

    public async Task UploadImageAsync(string name, Stream imageStream, Guid userId, CancellationToken ct = default)
    {
        string fileName = Path.GetFileName(name);
        string filePath = this.GetFilePath(fileName);
        string metadataFilePath = this.GetMetadataFilePath(fileName);

        var imageBytes = ReadStreamToBytes(imageStream);

        await File.WriteAllBytesAsync(filePath, imageBytes, ct);

        var metadata = new { userId = userId.ToString() };
        var metadataJson = JsonSerializer.Serialize(metadata);

        await File.WriteAllTextAsync(metadataFilePath, metadataJson, ct);
    }

    public Task DeleteImageAsync(string name, CancellationToken ct = default)
    {
        string filePath = this.GetFilePath(name);
        string metadataFilePath = this.GetMetadataFilePath(name);

        File.Delete(filePath);
        File.Delete(metadataFilePath);

        return Task.CompletedTask;
    }

    public async Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default)
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

    private string GetFilePath(string name) => Path.Combine(this.analyzeFilePath, name);

    private string GetMetadataFilePath(string name) => Path.Combine(this.analyzeFilePath, $"{name}.metadata.json");

    public Task MarkAsProcessedAsync(string name, CancellationToken ct = default)
    {
        // No-op for file system implementation
        return Task.CompletedTask;
    }

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
