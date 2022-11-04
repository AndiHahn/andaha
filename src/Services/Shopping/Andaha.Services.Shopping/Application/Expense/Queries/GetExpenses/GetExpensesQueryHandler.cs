using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Expense.Queries.GetExpenses;

internal class GetExpensesQueryHandler : IRequestHandler<GetExpensesQuery, IReadOnlyCollection<ExpenseDto>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetExpensesQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IReadOnlyCollection<ExpenseDto>> Handle(GetExpensesQuery request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var result = await this.dbContext.Bill
            .AsNoTracking()
            .Where(bill => (bill.UserId == userId ||
                           connectedUsers.Contains(bill.UserId)) &&
                           bill.Date >= request.StartTime &&
                           bill.Date <= request.EndTime)
            .GroupBy(bill => bill.Category.Name)
            .Select(group => new ExpenseDto(group.Key, group.Sum(b => b.Price)))
            .ToListAsync(cancellationToken);

        return result.OrderByDescending(expense => expense.Costs).ToList();
    }
}
