namespace Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;

public readonly record struct HiddenBillSuggestionDto(
    Guid Id,
    string ShopName,
    Guid CategoryId,
    string CategoryName,
    Guid? SubCategoryId,
    string? SubCategoryName);
