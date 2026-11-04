using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Common;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.GetBillSuggestions.V1;

internal class GetBillSuggestionsQueryHandler : IRequestHandler<GetBillSuggestionsQuery, IResult>
{
    private const int WindowDays = 90;
    private const int MinimumBills = 2;
    private const int MaxSuggestions = 20;

    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public GetBillSuggestionsQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(GetBillSuggestionsQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var usages = await ShopUsageQuery.GetAsync(
            dbContext,
            userId,
            DateTime.UtcNow.AddDays(-WindowDays),
            cancellationToken);

        var hidden = await dbContext.HiddenBillSuggestion
            .AsNoTracking()
            .Where(suggestion => suggestion.UserId == userId)
            .Select(suggestion => new { suggestion.ShopName, suggestion.CategoryId, suggestion.SubCategoryId })
            .ToListAsync(cancellationToken);

        var hiddenKeys = hidden
            .Select(suggestion => (suggestion.ShopName.Trim().ToLowerInvariant(), suggestion.CategoryId, suggestion.SubCategoryId))
            .ToHashSet();

        var suggestions = usages
            .Where(usage => usage.Count >= MinimumBills)
            .Where(usage => !hiddenKeys.Contains((usage.ShopName.ToLowerInvariant(), usage.CategoryId, usage.SubCategoryId)))
            .Take(MaxSuggestions)
            .Select(usage => new BillSuggestionDto(usage.ShopName, usage.CategoryId, usage.SubCategoryId, usage.Count))
            .ToArray();

        return Results.Ok(suggestions);
    }
}
