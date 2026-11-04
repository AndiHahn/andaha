using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;

internal static class BillTemplateDtoMapping
{
    internal static readonly Expression<Func<Core.BillTemplate, BillTemplateDto>> EntityToDto =
        template => new BillTemplateDto(
            template.Id,
            template.Name,
            template.ShopName,
            template.CategoryId,
            template.SubCategoryId,
            template.SortOrder);
}
