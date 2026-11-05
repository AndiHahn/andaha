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

        var bills = dbContext.Bill
            .AsNoTracking()
            .Where(GetUserFilterExpression(userId, connectedUsers));

        // Nullable projections: an account without bills has no Min/Max and gets the empty range,
        // also when its last bill is deleted between the two queries.
        DateTime? startDate = await bills.MinAsync(bill => (DateTime?)bill.Date, cancellationToken);
        DateTime? endDate = startDate is null
            ? null
            : await bills.MaxAsync(bill => (DateTime?)bill.Date, cancellationToken);

        if (startDate is null || endDate is null)
        {
            return Results.Ok(new TimeRangeDto());
        }

        return Results.Ok(new TimeRangeDto(startDate.Value, endDate.Value));
    }

    private Expression<Func<Core.Bill, bool>> GetUserFilterExpression(Guid userId, IReadOnlyCollection<Guid> connectedUsers)
        => (bill) => bill.UserId == userId || connectedUsers.Contains(bill.UserId);
}
