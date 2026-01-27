namespace Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;

public class CategoryClassificationResult
{
    public required Guid CategoryId { get; set; }

    public double CategoryConfidence { get; set; }

    public Guid? SubCategoryId { get; set; }

    public double? SubCategoryConfidence { get; set; }

    public string? Reasoning { get; set; }

    public override string ToString()
        => $"CategoryId: {CategoryId}, CategoryConfidence: {CategoryConfidence}, SubCategoryId: {SubCategoryId}, SubCategoryConfidence: {SubCategoryConfidence}, Reasoning: {Reasoning}";
}
