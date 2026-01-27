namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories;

public record ImageMetadata
{
    public required string ImageName { get; set; }

    public required DateTimeOffset LastModified { get; set; }
}
