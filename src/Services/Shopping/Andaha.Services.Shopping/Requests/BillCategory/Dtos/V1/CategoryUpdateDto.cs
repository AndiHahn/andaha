namespace Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;

public readonly record struct CategoryUpdateDto(Guid? Id, string Name, string Color, IReadOnlyCollection<SubCategoryUpdateDto> SubCategories);
