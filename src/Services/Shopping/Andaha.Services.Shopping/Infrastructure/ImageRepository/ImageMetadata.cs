namespace Andaha.Services.Shopping.Infrastructure.ImageRepository;

public record ImageMetadata
{
    public string ImageName { get; set; }

    public DateTimeOffset LastModified { get; set; }
}
