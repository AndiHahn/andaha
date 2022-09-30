using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Dapr.Client;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;

namespace Andaha.Services.Shopping.Application.Queries.SearchBills;

internal class SearchBillsQueryHandler : IRequestHandler<SearchBillsQuery, PagedResult<BillDto>>
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

    public async Task<PagedResult<BillDto>> Handle(SearchBillsQuery request, CancellationToken cancellationToken)
    {
        Guid currentUserId = this.identityService.GetUserId();

        var connectedUserIds = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var userIds = new List<Guid> { currentUserId };

        if (connectedUserIds is not null && connectedUserIds.Any())
        {
            userIds.AddRange(connectedUserIds);
        }

        var query = this.dbContext.Bill
            .Include(bill => bill.Category)
            .OrderByDescending(b => b.Date)
            .Where(b => userIds.Contains(b.CreatedByUserId));

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
