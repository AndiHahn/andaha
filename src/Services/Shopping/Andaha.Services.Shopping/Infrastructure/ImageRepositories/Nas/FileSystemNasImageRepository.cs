using System.Text.Json;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Nas;

public class FileSystemNasImageRepository : INasImageRepository
{
    private readonly string filePath = "nas";

    public FileSystemNasImageRepository()
    {
        if (!Directory.Exists(this.filePath))
        {
            Directory.CreateDirectory(this.filePath);
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

    public async Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default)
    {
        if (!Directory.Exists(filePath))
        {
            return [];
        }

        var enumerationOptions = new EnumerationOptions { RecurseSubdirectories = true };

        var result = new List<ImageMetadata>();

        foreach (var filePath in Directory.EnumerateFiles(filePath, "", enumerationOptions: enumerationOptions))
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
                ImageName = fileName, //TODO full file name incl. path or only name?
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

    private string GetFilePath(string name) => Path.Combine(this.filePath, name);

    private string GetMetadataFilePath(string name) => Path.Combine(this.filePath, $"{name}.metadata.json");

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
