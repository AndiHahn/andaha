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

    private string GetFilePath(string name) => Path.Combine(this.nasFolderPath, name);

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

        // If no GUID found, return Guid.Empty
        return Guid.Empty;
    }

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
