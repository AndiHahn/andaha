using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillCategory.UpdateOrder.V1;

internal class UpdateOrderCommandHandler : IRequestHandler<UpdateOrderCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateOrderCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(UpdateOrderCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var categories = await this.dbContext.BillCategory
            .Where(category => category.UserId == userId)
            .ToListAsync(cancellationToken);

        foreach (var categoryOrder in request.Orders)
        {
            var category = categories.FirstOrDefault(category => category.Id == categoryOrder.CategoryId);
            if (category is null)
            {
                return Results.NotFound($"Category with id '{categoryOrder.CategoryId}' not found.");
            }

            category.UpdateOrder(categoryOrder.Order);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
