using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories;

public static class ImageResizer
{
    public static Stream ShrinkProportional(Stream fileStream, int size)
    {
        int width;
        int height;

        using SixLabors.ImageSharp.Image originalImage = SixLabors.ImageSharp.Image.Load(fileStream);

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

        Stream outStream = new MemoryStream();

        originalImage.Save(outStream, new PngEncoder());

        return outStream;
    }
}
