using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Expense.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.Expense.GetAvailableTimeRange.V1;

internal class GetAvailableTimeRangeQueryHandler : IRequestHandler<GetAvailableTimeRangeQuery, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetAvailableTimeRangeQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetAvailableTimeRangeQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var result = await dbContext.Bill
            .AsNoTracking()
            .Select(bill => new
            {
                StartDate = dbContext.Bill.Where(GetUserFilterExpression(userId, connectedUsers)).Min(b => b.Date),
                EndDate = dbContext.Bill.Where(GetUserFilterExpression(userId, connectedUsers)).Max(b => b.Date)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return Results.Ok(new TimeRangeDto());
        }

        return Results.Ok(new TimeRangeDto(result.StartDate, result.EndDate));
    }

    private Expression<Func<Core.Bill, bool>> GetUserFilterExpression(Guid userId, IReadOnlyCollection<Guid> connectedUsers)
        => (bill) => bill.UserId == userId || connectedUsers.Contains(bill.UserId);
}
