using Andaha.Services.Shopping.Application.Services;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Expense.Queries.GetExpenses;

internal class GetExpensesQueryHandler : IRequestHandler<GetExpensesQuery, IReadOnlyCollection<ExpenseDto>>
{
    private readonly ShoppingDbContext dbContext;
    private readonly ICollaborationService collaborationService;

    public GetExpensesQueryHandler(
        ShoppingDbContext dbContext,
        ICollaborationService collaborationService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.collaborationService = collaborationService ?? throw new ArgumentNullException(nameof(collaborationService));
    }

    public async Task<IReadOnlyCollection<ExpenseDto>> Handle(GetExpensesQuery request, CancellationToken cancellationToken)
    {
        await this.collaborationService.SetConnectedUsersAsync(cancellationToken);

        var result = await this.dbContext.Bill
            .Where(bill => bill.Date >= request.StartTime &&
                           bill.Date <= request.EndTime)
            .GroupBy(bill => bill.Category.Name)
            .Select(group => new ExpenseDto(group.Key, group.Sum(b => b.Price)))
            .ToListAsync(cancellationToken);

        return result.OrderByDescending(expense => expense.Costs).ToList();
    }
}
