using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using Dapr.Client;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;

namespace Andaha.Services.Shopping.Application.Queries.SearchBills;

internal class SearchBillsQueryHandler : IRequestHandler<SearchBillsQuery, PagedResult<BillDto>>
{
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly DaprClient daprClient;
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public SearchBillsQueryHandler(
        IHttpContextAccessor httpContextAccessor,
        DaprClient daprClient,
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        this.daprClient = daprClient ?? throw new ArgumentNullException(nameof(daprClient));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<PagedResult<BillDto>> Handle(SearchBillsQuery request, CancellationToken cancellationToken)
    {
        Guid currentUserId = this.identityService.GetUserId();

        var connectedUserIds = await GetConnectedUsers(cancellationToken);

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

    private async Task<IReadOnlyCollection<Guid>> GetConnectedUsers(CancellationToken cancellationToken)
    {
        try
        {
            var authHeader = this.httpContextAccessor.HttpContext.Request.Headers.Authorization.First();
            var authToken = authHeader.Substring("Bearer ".Length).Trim();

            var request = this.daprClient.CreateInvokeMethodRequest(HttpMethod.Get, "collaboration-api", "/api/connection/users");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", authToken);

            return await this.daprClient.InvokeMethodAsync<IReadOnlyCollection<Guid>>(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new List<Guid>();
        }
    }
}
