using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;

namespace Andaha.Services.Shopping.Requests.BillCategory.CreateBillCategory.V1;

public record CategoryCreateDto(
    string Name,
    string Color,
    bool IncludeToStatistics,
    IReadOnlyCollection<SubCategoryUpdateDto> SubCategories);
