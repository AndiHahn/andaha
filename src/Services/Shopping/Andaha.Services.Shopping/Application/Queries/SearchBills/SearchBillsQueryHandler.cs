using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Queries.SearchBills;

internal class SearchBillsQueryHandler : IRequestHandler<SearchBillsQuery, PagedResult<BillDto>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public SearchBillsQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<PagedResult<BillDto>> Handle(SearchBillsQuery request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var query = this.dbContext.Bill
            .OrderByDescending(b => b.Date)
            .Where(b => b.CreatedByUserId == userId);

        if (request.Search is not null)
        {
            query = query.Where(b => b.ShopName.Contains(request.Search) ||
                                     (b.Notes != null && b.Notes.Contains(request.Search)));
        }

        int totalCount = await query.CountAsync(cancellationToken);

        var queryResult = await query
            .Skip(request.PageSize * request.PageIndex)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<BillDto>(
            queryResult.Select(bill => bill.ToDto()),
            totalCount);
    }
}
