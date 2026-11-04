namespace Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;

public readonly record struct BillSuggestionDto(
    string ShopName,
    Guid CategoryId,
    Guid? SubCategoryId,
    int Count);
