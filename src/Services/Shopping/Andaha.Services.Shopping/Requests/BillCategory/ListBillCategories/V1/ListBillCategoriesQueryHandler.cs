using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillCategory.ListBillCategories.V1;

internal class ListBillCategoriesQueryHandler : IRequestHandler<ListBillCategoriesQuery, IResult>
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

    public async Task<IResult> Handle(ListBillCategoriesQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var categoryDtos = await dbContext.BillCategory
            .AsNoTracking()
            .Where(category => category.UserId == userId)
            .OrderBy(category => category.Order)
            .AsExpandable()
            .Select(category => CategoryDtoMapping.EntityToDto.Invoke(category))
            .ToListAsync(cancellationToken);

        if (!categoryDtos.Any())
        {
            var initialCategories = ShoppingDbContextSeed.CreateInitialCategories(userId);

            dbContext.BillCategory.AddRange(initialCategories);

            await dbContext.SaveChangesAsync(cancellationToken);

            categoryDtos = initialCategories
                .Select(category => CategoryDtoMapping.EntityToDto.Invoke(category))
                .OrderBy(category => category.Order)
                .ToList();
        }

        return Results.Ok(categoryDtos);
    }
}
