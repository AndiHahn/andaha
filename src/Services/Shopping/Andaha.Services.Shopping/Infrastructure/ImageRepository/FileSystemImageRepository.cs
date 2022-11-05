namespace Andaha.Services.Shopping.Infrastructure.ImageRepository;

internal class FileSystemImageRepository : IImageRepository
{
    private readonly string filePath = "images";

    public FileSystemImageRepository()
    {
        if (!Directory.Exists(this.filePath))
        {
            Directory.CreateDirectory(this.filePath);
        }
    }

    public async Task<Stream> GetImageStreamAsync(string name, CancellationToken cancellationToken)
    {
        string filePath = this.GetImagePath(name);

        var imageBytes = await File.ReadAllBytesAsync(filePath, cancellationToken);

        return new MemoryStream(imageBytes);
    }

    public Task UploadImageAsync(string name, Stream imageStream, CancellationToken cancellationToken)
    {
        string filePath = this.GetImagePath(name);

        var imageBytes = ReadStreamToBytes(imageStream);

        return File.WriteAllBytesAsync(filePath, imageBytes, cancellationToken);
    }

    public Task DeleteImageAsync(string name, CancellationToken cancellationToken)
    {
        string filePath = this.GetImagePath(name);

        File.Delete(filePath);

        return Task.CompletedTask;
    }

    private string GetImagePath(string name)
    {
        return Path.Combine(this.filePath, name);
    }

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
