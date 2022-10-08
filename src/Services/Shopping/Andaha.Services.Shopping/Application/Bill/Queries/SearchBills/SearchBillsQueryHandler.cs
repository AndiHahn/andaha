using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Application.Services;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Queries.SearchBills;

internal class SearchBillsQueryHandler : IRequestHandler<SearchBillsQuery, PagedResult<BillDto>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly ICollaborationService collaborationService;

    public SearchBillsQueryHandler(
        ShoppingDbContext dbContext,
        ICollaborationService collaborationService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.collaborationService = collaborationService ?? throw new ArgumentNullException(nameof(collaborationService));
    }

    public async Task<PagedResult<BillDto>> Handle(SearchBillsQuery request, CancellationToken cancellationToken)
    {
        await this.collaborationService.SetConnectedUsersAsync(cancellationToken);

        IQueryable<Core.Bill> query = this.dbContext.Bill
            .Include(bill => bill.Category)
            .OrderByDescending(b => b.Date);

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
