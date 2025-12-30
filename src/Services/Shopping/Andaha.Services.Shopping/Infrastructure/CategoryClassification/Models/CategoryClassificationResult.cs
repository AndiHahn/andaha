namespace Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;

public class CategoryClassificationResult
{
    public required Guid CategoryId { get; set; }

    public double Confidence { get; set; }

    public string? Reasoning { get; set; }
}
