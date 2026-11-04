using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.BillTemplate.HideBillSuggestion.V1;

public record HideBillSuggestionCommand(
    string ShopName,
    Guid CategoryId,
    Guid? SubCategoryId) : IHttpRequest;
