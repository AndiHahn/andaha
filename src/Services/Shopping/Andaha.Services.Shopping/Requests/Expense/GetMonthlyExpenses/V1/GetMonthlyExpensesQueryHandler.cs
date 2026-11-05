using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Expense.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace Andaha.Services.Shopping.Requests.Expense.GetMonthlyExpenses.V1;

internal class GetMonthlyExpensesQueryHandler : IRequestHandler<GetMonthlyExpensesQuery, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetMonthlyExpensesQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetMonthlyExpensesQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var untilMonth = DateTime.ParseExact(request.Until, "yyyy-MM", CultureInfo.InvariantCulture);
        var start = untilMonth.AddMonths(1 - request.Months);
        var endExclusive = untilMonth.AddMonths(1);

        var sums = await dbContext.Bill
            .AsNoTracking()
            .Where(bill => (bill.UserId == userId || connectedUsers.Contains(bill.UserId)) &&
                           bill.Date >= start &&
                           bill.Date < endExclusive &&
                           bill.Category.IncludeToStatistics)
            .GroupBy(bill => new { bill.Date.Year, bill.Date.Month })
            .Select(group => new { group.Key.Year, group.Key.Month, Sum = group.Sum(b => b.Price) })
            .ToListAsync(cancellationToken);

        var result = Enumerable.Range(0, request.Months)
            .Select(offset => start.AddMonths(offset))
            .Select(month => new MonthlyCostsDto(
                month.ToString("yyyy-MM", CultureInfo.InvariantCulture),
                sums.Where(s => s.Year == month.Year && s.Month == month.Month).Sum(s => s.Sum)))
            .ToArray();

        return Results.Ok(result);
    }
}
