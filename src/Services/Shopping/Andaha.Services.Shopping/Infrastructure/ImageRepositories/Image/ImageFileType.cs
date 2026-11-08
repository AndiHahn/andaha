namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

/// <summary>File type of a stored bill image, detected from the first bytes.</summary>
public sealed record ImageFileType(string Extension, string ContentType)
{
    public static readonly ImageFileType Unknown = new(".bin", "application/octet-stream");

    private static readonly ImageFileType Jpeg = new(".jpg", "image/jpeg");
    private static readonly ImageFileType Png = new(".png", "image/png");
    private static readonly ImageFileType WebP = new(".webp", "image/webp");
    private static readonly ImageFileType Heic = new(".heic", "image/heic");
    private static readonly ImageFileType Pdf = new(".pdf", "application/pdf");

    private static readonly string[] HeicBrands = ["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"];

    private const int HeaderLength = 16;

    public static ImageFileType Detect(ReadOnlySpan<byte> header)
    {
        if (header.StartsWith(new byte[] { 0xFF, 0xD8, 0xFF }))
        {
            return Jpeg;
        }

        if (header.StartsWith(new byte[] { 0x89, 0x50, 0x4E, 0x47 }))
        {
            return Png;
        }

        if (header.Length >= 12 && header[..4].SequenceEqual("RIFF"u8) && header.Slice(8, 4).SequenceEqual("WEBP"u8))
        {
            return WebP;
        }

        if (header.Length >= 12 && header.Slice(4, 4).SequenceEqual("ftyp"u8))
        {
            var brand = System.Text.Encoding.ASCII.GetString(header.Slice(8, 4));
            if (Array.IndexOf(HeicBrands, brand) >= 0)
            {
                return Heic;
            }
        }

        if (header.StartsWith("%PDF"u8))
        {
            return Pdf;
        }

        return Unknown;
    }

    /// <summary>Reads at most 16 bytes and restores the stream position. The stream must be seekable.</summary>
    public static async Task<ImageFileType> DetectAsync(Stream seekableStream, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(seekableStream);
        if (!seekableStream.CanSeek)
        {
            throw new ArgumentException("Stream must be seekable.", nameof(seekableStream));
        }

        var original = seekableStream.Position;
        try
        {
            var buffer = new byte[HeaderLength];
            var total = 0;
            while (total < HeaderLength)
            {
                var read = await seekableStream.ReadAsync(buffer.AsMemory(total, HeaderLength - total), ct);
                if (read == 0)
                {
                    break;
                }

                total += read;
            }

            return Detect(buffer.AsSpan(0, total));
        }
        finally
        {
            seekableStream.Position = original;
        }
    }
}
