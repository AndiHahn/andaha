using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.Income.UpdateIncome.V1;

internal class UpdateIncomeRequestHandler : IRequestHandler<UpdateIncomeRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateIncomeRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(UpdateIncomeRequest request, CancellationToken cancellationToken)
    {
        //Guid userId = this.identityService.GetUserId();

        var income = await dbContext.Income.FindByIdAsync(request.Id, cancellationToken);
        if (income is null)
        {
            return Results.NotFound($"Income with id '{request.Id}' not found.");
        }

        income.Update(request.Income.Name, request.Income.Value, null);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}

