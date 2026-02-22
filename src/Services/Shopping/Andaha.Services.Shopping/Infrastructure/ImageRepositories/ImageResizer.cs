using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories;

public static class ImageResizer
{
    public static Stream ShrinkProportional(Stream fileStream, int size)
    {
        if (fileStream == null) throw new ArgumentNullException(nameof(fileStream));

        // Ensure we have a seekable stream starting at position 0. Some incoming streams
        // (e.g. request streams) might not be seekable or may already be at the end.
        Stream input = fileStream;
        MemoryStream? tempStream = null;

        if (!fileStream.CanSeek)
        {
            tempStream = new MemoryStream();
            fileStream.CopyTo(tempStream);
            tempStream.Position = 0;
            input = tempStream;
        }
        else
        {
            input.Position = 0;
        }

        // Load image from the prepared stream
        using (var originalImage = SixLabors.ImageSharp.Image.Load(input))
        {
            int width;
            int height;

            // Not necessary to resize if the image is already smaller than the requested size
            if (size > originalImage.Width && size > originalImage.Height)
            {
                width = originalImage.Width;
                height = originalImage.Height;
            }
            else if (originalImage.Width > originalImage.Height)
            {
                double aspectRatio = (double)originalImage.Width / originalImage.Height;
                width = size;
                height = (int)(width / aspectRatio);
            }
            else
            {
                double aspectRatio = (double)originalImage.Width / originalImage.Height;
                height = size;
                width = (int)(height * aspectRatio);
            }

            originalImage.Mutate(operation => operation.Resize(width, height));

            var outStream = new MemoryStream();

            originalImage.Save(outStream, new PngEncoder());

            outStream.Position = 0;

            // dispose temporary buffer if we created one
            tempStream?.Dispose();

            return outStream;
        }
    }
}
