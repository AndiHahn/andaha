using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Data;

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

        var categoryDtos = await ListCategoriesAsync(userId, cancellationToken);

        if (!categoryDtos.Any())
        {
            await SeedInitialCategoriesIfNoneExistAsync(userId, cancellationToken);

            categoryDtos = await ListCategoriesAsync(userId, cancellationToken);
        }

        return Results.Ok(categoryDtos);
    }

    private Task<List<CategoryDto>> ListCategoriesAsync(Guid userId, CancellationToken cancellationToken)
    {
        return dbContext.BillCategory
            .AsNoTracking()
            .Where(category => category.UserId == userId)
            .OrderBy(category => category.Order)
            .AsExpandable()
            .Select(category => CategoryDtoMapping.EntityToDto.Invoke(category))
            .ToListAsync(cancellationToken);
    }

    // Two parallel first requests must not both seed: check and insert run in one serializable transaction,
    // and the categories are only created while the user still has none. No unique index (existing duplicates).
    private async Task SeedInitialCategoriesIfNoneExistAsync(Guid userId, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        bool hasCategories = await dbContext.BillCategory.AnyAsync(category => category.UserId == userId, cancellationToken);
        if (!hasCategories)
        {
            dbContext.BillCategory.AddRange(ShoppingDbContextSeed.CreateInitialCategories(userId));

            await dbContext.SaveChangesAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
    }
}
