using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;

namespace Andaha.Services.Shopping.Infrastructure.CategoryClassification;

public interface ICategoryClassificationService
{
    Task<CategoryClassificationResult> ClassifyAsync(
        string? vendorName,
        string[] lineItemDescriptions,
        BillCategory[] availableCategories,
        CancellationToken ct = default);
}
