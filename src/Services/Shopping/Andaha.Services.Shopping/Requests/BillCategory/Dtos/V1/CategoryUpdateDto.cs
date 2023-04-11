namespace Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;

public readonly record struct CategoryUpdateDto(
    string Name,
    string Color,
    bool IncludeToStatistics,
    IReadOnlyCollection<SubCategoryUpdateDto> SubCategories);
