using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Queries.ListBillCategories;

internal class ListBillCategoriesQueryHandler : IRequestHandler<ListBillCategoriesQuery, Result<IEnumerable<BillCategoryDto>>>
{
    private readonly ShoppingDbContext dbContext;

    public ListBillCategoriesQueryHandler(ShoppingDbContext dbContext)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<Result<IEnumerable<BillCategoryDto>>> Handle(ListBillCategoriesQuery request, CancellationToken cancellationToken)
    {
        var entities = await this.dbContext.BillCategory.ToListAsync(cancellationToken);

        var dtos = entities.Select(entity => new BillCategoryDto(entity.Id, entity.Name, entity.Color));

        return Result<IEnumerable<BillCategoryDto>>.Success(dtos);
    }
}
