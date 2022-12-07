using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;

internal static class BillCategoryDtoMapping
{
    public static Expression<Func<Core.BillCategory, BillCategoryDto>> EntityToDto =
        entity => new BillCategoryDto(entity.Id, entity.Name, entity.Color, entity.IsDefault);
}
