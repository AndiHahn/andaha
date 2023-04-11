using LinqKit;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;

internal static class CategoryDtoMapping
{
    public static Expression<Func<Core.BillCategory, CategoryDto>> EntityToDto =
        entity => new CategoryDto(
            entity.Id,
            entity.Name,
            entity.Color,
            entity.Order,
            entity.IsDefault,
            entity.IncludeToStatistics,
            entity.SubCategories
                .OrderBy(subCategory => subCategory.Order)
                .Select(subCategory => SubCategoryDtoMapping.EntityToDto.Invoke(subCategory)!.Value)
                .ToArray());
}
