using Andaha.Services.Shopping.Core;

namespace Andaha.Services.Shopping.Dtos.v1_0;

internal static class BillCategoryDtoMappingExtensions
{
    public static BillCategoryDto ToDto(this BillCategory category)
        => new(category.Id, category.Name, category.Color, category.IsDefault);
}
