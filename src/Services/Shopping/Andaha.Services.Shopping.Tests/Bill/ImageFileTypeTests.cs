using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

namespace Andaha.Services.Shopping.Tests.Bill;

public class ImageFileTypeTests
{
    private static byte[] Ftyp(string brand)
        => [0, 0, 0, 0x18, (byte)'f', (byte)'t', (byte)'y', (byte)'p', .. System.Text.Encoding.ASCII.GetBytes(brand)];

    public static IEnumerable<object[]> Cases()
    {
        yield return [new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0, 0 }, ".jpg", "image/jpeg"];
        yield return [new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A }, ".png", "image/png"];
        yield return [new byte[] { (byte)'R', (byte)'I', (byte)'F', (byte)'F', 1, 2, 3, 4, (byte)'W', (byte)'E', (byte)'B', (byte)'P' }, ".webp", "image/webp"];
        yield return [Ftyp("heic"), ".heic", "image/heic"];
        yield return [Ftyp("mif1"), ".heic", "image/heic"];
        yield return [new byte[] { (byte)'%', (byte)'P', (byte)'D', (byte)'F', (byte)'-' }, ".pdf", "application/pdf"];
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public void Detect_KnownFormats(byte[] header, string ext, string contentType)
    {
        var type = ImageFileType.Detect(header);
        Assert.Equal(ext, type.Extension);
        Assert.Equal(contentType, type.ContentType);
    }

    [Fact]
    public void Detect_UnknownOrEmpty_IsBin()
    {
        Assert.Equal(ImageFileType.Unknown, ImageFileType.Detect(new byte[] { 1, 2, 3, 4, 5 }));
        Assert.Equal(ImageFileType.Unknown, ImageFileType.Detect([]));
        Assert.Equal(ImageFileType.Unknown, ImageFileType.Detect(Ftyp("abcd")));
        Assert.Equal(".bin", ImageFileType.Unknown.Extension);
        Assert.Equal("application/octet-stream", ImageFileType.Unknown.ContentType);
    }

    [Fact]
    public async Task DetectAsync_RestoresPosition()
    {
        var ms = new MemoryStream([0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3]);
        var type = await ImageFileType.DetectAsync(ms, CancellationToken.None);
        Assert.Equal(".jpg", type.Extension);
        Assert.Equal(0, ms.Position);
    }

    [Fact]
    public async Task DetectAsync_RestoresNonZeroPosition_AndShortStream()
    {
        var ms = new MemoryStream([0x89, 0x50]);
        ms.Position = 1;
        var type = await ImageFileType.DetectAsync(ms, CancellationToken.None);
        Assert.Equal(ImageFileType.Unknown, type);
        Assert.Equal(1, ms.Position);
    }
}
