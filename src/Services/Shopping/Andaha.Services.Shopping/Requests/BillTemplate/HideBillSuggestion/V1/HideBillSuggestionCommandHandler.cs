using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.HideBillSuggestion.V1;

internal class HideBillSuggestionCommandHandler : IRequestHandler<HideBillSuggestionCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public HideBillSuggestionCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(HideBillSuggestionCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var shopName = request.ShopName.Trim();
        var normalized = shopName.ToLower();

        var exists = await dbContext.HiddenBillSuggestion
            .AnyAsync(
                suggestion => suggestion.UserId == userId &&
                              suggestion.CategoryId == request.CategoryId &&
                              suggestion.SubCategoryId == request.SubCategoryId &&
                              suggestion.ShopName.ToLower() == normalized,
                cancellationToken);

        if (!exists)
        {
            dbContext.HiddenBillSuggestion.Add(
                new HiddenBillSuggestion(userId, shopName, request.CategoryId, request.SubCategoryId));

            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return Results.NoContent();
    }
}
