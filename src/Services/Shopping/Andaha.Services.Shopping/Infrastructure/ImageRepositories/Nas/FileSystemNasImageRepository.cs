namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Nas;

public class FileSystemNasImageRepository : INasImageRepository
{
    private readonly string nasFolderPath = "nas";

    public FileSystemNasImageRepository()
    {
        if (!Directory.Exists(this.nasFolderPath))
        {
            Directory.CreateDirectory(this.nasFolderPath);
        }
    }

    public async Task<(Stream Image, Guid UserId)> GetImageAsync(string filePath, CancellationToken ct = default)
    {
        var imageBytes = await File.ReadAllBytesAsync(filePath, ct);

        var userId = GetUserIdFromPath(filePath);

        return (new MemoryStream(imageBytes), userId);
    }

    public async Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default)
    {
        if (!Directory.Exists(nasFolderPath))
        {
            return [];
        }

        var enumerationOptions = new EnumerationOptions { RecurseSubdirectories = true };

        var result = new List<ImageMetadata>();

        foreach (var filePath in Directory.EnumerateFiles(nasFolderPath, "*", enumerationOptions: enumerationOptions))
        {
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
                ImageName = filePath,
                LastModified = lastModified
            });
        }

        return result;
    }

    public async Task UploadImageAsync(string name, Guid userId, Stream imageStream, CancellationToken ct = default)
    {
        string filePath = this.GetFilePath(name, userId);

        var directory = Path.GetDirectoryName(filePath);
        if (string.IsNullOrWhiteSpace(directory))
        {
            throw new InvalidOperationException($"Could not determine directory for file path '{filePath}'");
        }

        if (!Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        var imageBytes = await ReadStreamToBytesAsync(imageStream, ct);

        await File.WriteAllBytesAsync(filePath, imageBytes, ct);
    }

    private string GetFilePath(string name, Guid userId) => Path.Combine(this.nasFolderPath, userId.ToString(), name);

    private static Guid GetUserIdFromPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return Guid.Empty;

        // Normalize separators and split path
        var normalized = path.Replace('\\', '/').Trim('/');
        var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);

        // Find first segment that is a valid GUID
        foreach (var segment in segments)
        {
            if (Guid.TryParse(segment, out var guid))
            {
                return guid;
            }
        }

        throw new InvalidOperationException("Did not find a valid userId in path: " + path);
    }

    private static async Task<byte[]> ReadStreamToBytesAsync(Stream input, CancellationToken ct = default)
    {
        using MemoryStream ms = new();
        await input.CopyToAsync(ms, ct);
        return ms.ToArray();
    }
}
