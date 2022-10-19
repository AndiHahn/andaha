using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Queries.ListBillCategories;

internal class ListBillCategoriesQueryHandler : IRequestHandler<ListBillCategoriesQuery, Result<IEnumerable<BillCategoryDto>>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public ListBillCategoriesQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<Result<IEnumerable<BillCategoryDto>>> Handle(ListBillCategoriesQuery request, CancellationToken cancellationToken)
    {
        var entities = await this.dbContext.BillCategory
            .OrderBy(category => category.IsDefault)
            .ToListAsync(cancellationToken);
        if (!entities.Any())
        {
            var initialCategories = ShoppingDbContextSeed.CreateInitialCategories(this.identityService.GetUserId());
            this.dbContext.BillCategory.AddRange(initialCategories);

            await this.dbContext.SaveChangesAsync(cancellationToken);

            entities = initialCategories.ToList();
        }

        var dtos = entities.Select(entity => entity.ToDto());

        return Result<IEnumerable<BillCategoryDto>>.Success(dtos);
    }
}
