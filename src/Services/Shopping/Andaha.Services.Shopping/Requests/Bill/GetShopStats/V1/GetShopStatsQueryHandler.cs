using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Common;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using MediatR;

namespace Andaha.Services.Shopping.Requests.Bill.GetShopStats.V1;

internal class GetShopStatsQueryHandler : IRequestHandler<GetShopStatsQuery, IResult>
{
    private const int WindowDays = 365;

    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public GetShopStatsQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(GetShopStatsQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var usages = await ShopUsageQuery.GetAsync(
            dbContext,
            userId,
            DateTime.UtcNow.AddDays(-WindowDays),
            cancellationToken);

        var stats = usages
            .Select(usage => new ShopStatDto(usage.ShopName, usage.CategoryId, usage.SubCategoryId, usage.Count, usage.LastUsed))
            .ToArray();

        return Results.Ok(stats);
    }
}
