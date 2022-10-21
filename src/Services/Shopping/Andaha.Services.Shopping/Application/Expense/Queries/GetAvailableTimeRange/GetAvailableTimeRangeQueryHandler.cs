using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Application.Expense.Queries.GetAvailableTimeRange;

internal class GetAvailableTimeRangeQueryHandler : IRequestHandler<GetAvailableTimeRangeQuery, TimeRangeDto>
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

    public async Task<TimeRangeDto> Handle(GetAvailableTimeRangeQuery request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var result = await this.dbContext.Bill
            .Select(bill => new
            {
                StartDate = this.dbContext.Bill.Where(GetUserFilterExpression(userId, connectedUsers)).Min(b => b.Date),
                EndDate = this.dbContext.Bill.Where(GetUserFilterExpression(userId, connectedUsers)).Max(b => b.Date)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return new TimeRangeDto();
        }

        return new TimeRangeDto(result.StartDate, result.EndDate);
    }

    private Expression<Func<Core.Bill, bool>> GetUserFilterExpression(Guid userId, IReadOnlyCollection<Guid> connectedUsers)
        => (bill) => bill.UserId == userId || connectedUsers.Contains(bill.UserId);
}
