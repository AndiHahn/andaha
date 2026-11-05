using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.ListHiddenSuggestions.V1;

internal class ListHiddenSuggestionsQueryHandler(
    ShoppingDbContext dbContext,
    IIdentityService identityService) : IRequestHandler<ListHiddenSuggestionsQuery, IResult>
{
    public async Task<IResult> Handle(ListHiddenSuggestionsQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var hiddenSuggestions = await dbContext.HiddenBillSuggestion
            .AsNoTracking()
            .Where(suggestion => suggestion.UserId == userId)
            .OrderBy(suggestion => suggestion.ShopName)
            .ThenBy(suggestion => suggestion.Category.Name)
            .Select(suggestion => new HiddenBillSuggestionDto(
                suggestion.Id,
                suggestion.ShopName,
                suggestion.CategoryId,
                suggestion.Category.Name,
                suggestion.SubCategoryId,
                suggestion.SubCategory != null ? suggestion.SubCategory.Name : null))
            .ToArrayAsync(cancellationToken);

        return Results.Ok(hiddenSuggestions);
    }
}
