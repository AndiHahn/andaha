using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillCategory.CreateBillCategory.V1;

internal class CreateBillCategoryCommandHandler : IRequestHandler<CreateBillCategoryCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public CreateBillCategoryCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(CreateBillCategoryCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var order = await this.dbContext.BillCategory
            .Where(category => category.UserId == userId)
            .MaxAsync(category => category.Order, cancellationToken);

        var category = new Core.BillCategory(
            userId,
            request.Category.Name,
            request.Category.Color,
            order + 1,
            request.Category.SubCategories.Select(subCategory => (subCategory.Name, subCategory.Order)).ToArray(),
            request.Category.IncludeToStatistics,
            isDefault: false);

        dbContext.BillCategory.Add(category);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}