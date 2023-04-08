using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;

internal static class SubCategoryDtoMapping
{
    public static Expression<Func<Core.BillSubCategory?, SubCategoryDto?>> EntityToDto =
        entity => entity == null ? null : new SubCategoryDto(entity.Id, entity.Name, entity.Order);
}
