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
                           connectedUsers.Contains(bill.UserId))
            .OrderByDescending(b => b.Date)
            .ThenByDescending(b => b.CreatedAt);

        if (request.Search is not null)
        {
            query = query.Where(b => b.ShopName.Contains(request.Search) ||
                                     b.Notes != null && b.Notes.Contains(request.Search));
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

        var queryResult = await query
            .AsExpandable()
            .Select(bill => BillDtoMapping.EntityToDto.Invoke(bill, userId))
            .Skip(request.PageSize * request.PageIndex)
            .Take(request.PageSize)
            .ToArrayAsync(cancellationToken);

        return Results.Ok(new PagedResultDto<BillDto>(queryResult, totalCount));
    }
}
