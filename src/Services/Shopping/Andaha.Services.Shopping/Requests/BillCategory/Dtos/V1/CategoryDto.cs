namespace Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;

public readonly record struct CategoryDto(Guid Id, string Name, string Color, bool IsDefault, IReadOnlyCollection<SubCategoryDto> SubCategories);
