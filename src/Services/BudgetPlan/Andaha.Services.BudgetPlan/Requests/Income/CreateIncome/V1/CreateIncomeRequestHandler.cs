﻿using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using MediatR;

namespace Andaha.Services.BudgetPlan.Requests.Income.CreateIncome.V1;

internal class CreateIncomeRequestHandler : IRequestHandler<CreateIncomeRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public CreateIncomeRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(CreateIncomeRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var income = new Core.Income(userId, request.Income.Name, request.Income.Value, request.Income.Duration);

        dbContext.Income.Add(income);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
