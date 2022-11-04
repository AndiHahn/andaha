using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using LinqKit;
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
        Guid userId = this.identityService.GetUserId();

        var categoryDtos = await this.dbContext.BillCategory
            .AsNoTracking()
            .Where(category => category.UserId == userId)
            .AsExpandable()
            .Select(category => BillCategoryDtoMapping.EntityToDto.Invoke(category))
            .ToListAsync(cancellationToken);

        if (!categoryDtos.Any())
        {
            var initialCategories = ShoppingDbContextSeed.CreateInitialCategories(userId);

            this.dbContext.BillCategory.AddRange(initialCategories);

            await this.dbContext.SaveChangesAsync(cancellationToken);

            categoryDtos = initialCategories
                .Select(category => BillCategoryDtoMapping.EntityToDto.Invoke(category))
                .ToList();
        }

        return Result<IEnumerable<BillCategoryDto>>.Success(categoryDtos);
    }
}
