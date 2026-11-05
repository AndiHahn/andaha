using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.SearchBills.V1;

internal class SearchBillsQueryHandler : IRequestHandler<SearchBillsQuery, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public SearchBillsQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(SearchBillsQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        IQueryable<Core.Bill> query = dbContext.Bill
            .AsNoTracking()
            .Where(bill => bill.UserId == userId ||
                           connectedUsers.Contains(bill.UserId));

        if (request.Search is not null)
        {
            query = query.Where(b => b.ShopName.Contains(request.Search) ||
                                     b.Notes != null && b.Notes.Contains(request.Search) ||
                                     b.LineItems.Any(l => l.Description != null && l.Description.Contains(request.Search)));
        }

        if (request.CategoryFilter?.Length > 0)
        {
            query = query.Where(bill => request.CategoryFilter.Contains(bill.Category.Name));
        }

        if (request.FromDateFilter is not null)
        {
            query = query.Where(bill => bill.Date >= request.FromDateFilter);
        }

        if (request.UntilDateFilter is not null)
        {
            query = query.Where(bill => bill.Date <= request.UntilDateFilter);
        }

        int totalCount = await query.CountAsync(cancellationToken);
        double totalSum = await query.SumAsync(bill => bill.Price, cancellationToken);

        var monthSums = (await query
                .GroupBy(bill => new { bill.Date.Year, bill.Date.Month })
                .Select(group => new { group.Key.Year, group.Key.Month, Sum = group.Sum(b => b.Price) })
                .ToListAsync(cancellationToken))
            .OrderByDescending(m => m.Year)
            .ThenByDescending(m => m.Month)
            .Select(m => new MonthSumDto($"{m.Year:D4}-{m.Month:D2}", m.Sum))
            .ToArray();

        var orderedQuery = query
            .OrderByDescending(b => b.Date)
            .ThenByDescending(b => b.CreatedAt)
            .AsExpandable();

        var search = request.Search;
        var dtoQuery = search is null
            ? orderedQuery.Select(bill => BillDtoMapping.EntityToListDto.Invoke(bill, userId))
            : orderedQuery.Select(bill => BillDtoMapping.EntityToSearchListDto.Invoke(bill, userId, search));

        var queryResult = await dtoQuery
            .Skip(request.PageSize * request.PageIndex)
            .Take(request.PageSize)
            .ToArrayAsync(cancellationToken);

        return Results.Ok(new BillSearchResultDto(queryResult, totalCount, totalSum, monthSums));
    }
}
