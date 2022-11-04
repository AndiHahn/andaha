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

    public async Task<byte[]?> GetImageAsync(string name, CancellationToken cancellationToken)
    {
        string filePath = this.GetImagePath(name);

        var image = await File.ReadAllBytesAsync(filePath, cancellationToken);

        return image;
    }

    public Task UploadImageAsync(string name, byte[] image, CancellationToken cancellationToken)
    {
        string filePath = this.GetImagePath(name);

        return File.WriteAllBytesAsync(filePath, image, cancellationToken);
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
}
