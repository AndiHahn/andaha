using Andaha.Services.Shopping.Core;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Dtos.v1_0;

internal static class BillCategoryDtoMapping
{
    public static Expression<Func<BillCategory, BillCategoryDto>> EntityToDto =
        entity => new BillCategoryDto(entity.Id, entity.Name, entity.Color, entity.IsDefault);
}
