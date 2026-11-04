using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;

public class FileSystemAnalysisImageRepository : IAnalysisImageRepository
{
    private const string UserIdKey = "userId";
    private const string AttemptsKey = "attempts";
    private const string ClaimedUntilKey = "claimedUntil";
    private const string LegacyProcessedAtKey = "processedAt";

    private readonly string analyzeFilePath;

    public FileSystemAnalysisImageRepository()
        : this("analyze")
    {
    }

    internal FileSystemAnalysisImageRepository(string analyzeFilePath)
    {
        this.analyzeFilePath = analyzeFilePath;

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

            var metadata = await ReadMetadataObjectAsync(this.GetMetadataFilePath(fileName), ct);

            result.Add(new ImageMetadata
            {
                ImageName = fileName,
                LastModified = lastModified,
                Attempts = ReadAttempts(metadata),
                ClaimedUntilUtc = ReadClaimedUntil(metadata),
                LegacyProcessed = metadata.ContainsKey(LegacyProcessedAtKey),
            });
        }

        return result;
    }

    public async Task ClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default)
    {
        string metadataFilePath = this.GetMetadataFilePath(name);

        var metadata = await ReadMetadataObjectAsync(metadataFilePath, ct);

        metadata[AttemptsKey] = ReadAttempts(metadata) + 1;
        metadata[ClaimedUntilKey] = claimedUntilUtc.ToString("O", CultureInfo.InvariantCulture);

        await File.WriteAllTextAsync(metadataFilePath, metadata.ToJsonString(), ct);
    }

    private async static Task<Guid> ReadMetadataAsync(string metadataPath, CancellationToken ct)
    {
        var metadata = await ReadMetadataObjectAsync(metadataPath, ct);

        if (metadata[UserIdKey] is JsonValue userIdValue &&
            userIdValue.TryGetValue<string>(out var userIdText) &&
            Guid.TryParse(userIdText, out var userId))
        {
            return userId;
        }

        return Guid.Empty;
    }

    private static async Task<JsonObject> ReadMetadataObjectAsync(string metadataPath, CancellationToken ct)
    {
        if (!File.Exists(metadataPath))
        {
            return [];
        }

        try
        {
            var json = await File.ReadAllTextAsync(metadataPath, ct);

            return JsonNode.Parse(json) as JsonObject ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static int ReadAttempts(JsonObject metadata)
        => metadata[AttemptsKey] is JsonValue value && value.TryGetValue<int>(out var attempts) ? attempts : 0;

    private static DateTimeOffset? ReadClaimedUntil(JsonObject metadata)
        => metadata[ClaimedUntilKey] is JsonValue value &&
           value.TryGetValue<string>(out var text) &&
           DateTimeOffset.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var claimedUntil)
            ? claimedUntil
            : null;

    private string GetFilePath(string name) => Path.Combine(this.analyzeFilePath, name);

    private string GetMetadataFilePath(string name) => Path.Combine(this.analyzeFilePath, $"{name}.metadata.json");

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
