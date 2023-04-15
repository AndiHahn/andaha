using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Expense.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Andaha.Services.Shopping.Requests.Expense.GetExpenses.V1;

internal class GetExpensesQueryHandler : IRequestHandler<GetExpensesQuery, IResult>
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

    public async Task<IResult> Handle(GetExpensesQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var result = await dbContext.Bill
            .AsNoTracking()
            .Where(bill => (bill.UserId == userId ||
                           connectedUsers.Contains(bill.UserId)) &&
                           bill.Date >= request.StartTimeUtc &&
                           bill.Date <= request.EndTimeUtc &&
                           bill.Category.IncludeToStatistics)
            .GroupBy(bill => bill.Category.Name)
            .Select(group => new ExpenseDto(
                group.Key,
                group.Sum(b => b.Price),
                group
                    .Where(bill => bill.SubCategory != null)
                    .GroupBy(bill => bill.SubCategory!.Name)
                    .Select(subGroup => new ExpenseSubCategoryDto(
                        subGroup.Key,
                        subGroup.Sum(b => b.Price)))
                    .ToArray()))
            .ToListAsync(cancellationToken);

        return Results.Ok(result.OrderByDescending(expense => expense.Costs));
    }
}
