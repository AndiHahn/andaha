using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

namespace Andaha.Services.Shopping.Tests.Bill;

public sealed class FileSystemImageRepositoryTests : IDisposable
{
    private readonly string directory = Path.Combine(Path.GetTempPath(), "andaha-images-" + Guid.NewGuid().ToString("N"));
    private readonly FileSystemImageRepository repository;

    public FileSystemImageRepositoryTests()
    {
        repository = new FileSystemImageRepository(directory);
    }

    public void Dispose()
    {
        if (Directory.Exists(directory))
        {
            Directory.Delete(directory, recursive: true);
        }
    }

    private static async Task<byte[]> ReadAsync(Stream stream)
    {
        using (stream)
        {
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms);
            return ms.ToArray();
        }
    }

    [Fact]
    public async Task Upload_with_structured_name_creates_subfolders_and_roundtrips()
    {
        byte[] bytes = [1, 2, 3, 4];

        await repository.UploadImageAsync("u/2026/11/x.jpg", new MemoryStream(bytes), "image/jpeg");

        Assert.True(File.Exists(Path.Combine(directory, "images", "u", "2026", "11", "x.jpg")));
        Assert.Equal(bytes, await ReadAsync(await repository.GetImageStreamAsync("u/2026/11/x.jpg")));
    }

    [Fact]
    public async Task Copy_creates_target_and_keeps_source()
    {
        byte[] bytes = [9, 8, 7];
        await repository.UploadImageAsync("old.jpg", new MemoryStream(bytes), null);

        await repository.CopyImageAsync("old.jpg", "u/2026/11/new.jpg");

        Assert.Equal(bytes, await ReadAsync(await repository.GetImageStreamAsync("u/2026/11/new.jpg")));
        Assert.Equal(bytes, await ReadAsync(await repository.GetImageStreamAsync("old.jpg")));
    }

    [Fact]
    public async Task Copy_overwrites_existing_target()
    {
        await repository.UploadImageAsync("a.jpg", new MemoryStream([1]), null);
        await repository.UploadImageAsync("b.jpg", new MemoryStream([2, 2]), null);

        await repository.CopyImageAsync("a.jpg", "b.jpg");

        Assert.Equal(new byte[] { 1 }, await ReadAsync(await repository.GetImageStreamAsync("b.jpg")));
    }

    [Fact]
    public async Task Copy_of_missing_source_throws_FileNotFoundException()
    {
        await Assert.ThrowsAsync<FileNotFoundException>(() => repository.CopyImageAsync("missing.jpg", "t.jpg"));
    }

    [Fact]
    public async Task Delete_of_missing_file_does_not_throw()
    {
        await repository.DeleteImageAsync("nope/none.jpg");
    }
}
