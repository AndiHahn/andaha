namespace Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;

public readonly record struct BillTemplateDto(
    Guid Id,
    string? Name,
    string? ShopName,
    Guid CategoryId,
    Guid? SubCategoryId,
    int SortOrder);
