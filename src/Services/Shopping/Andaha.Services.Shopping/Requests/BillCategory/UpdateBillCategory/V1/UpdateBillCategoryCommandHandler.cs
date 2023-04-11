using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillCategory.UpdateBillCategory.V1;

internal class UpdateBillCategoryCommandHandler : IRequestHandler<UpdateBillCategoryCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateBillCategoryCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(UpdateBillCategoryCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var existingCategory = await this.dbContext.BillCategory
            .Include(category => category.SubCategories)
            .Where(category => category.UserId == userId)
            .FirstOrDefaultAsync(category => category.Id == request.Id, cancellationToken);

        if (existingCategory is null)
        {
            return Results.NotFound();
        }

        existingCategory.Update(
            request.Category.Name,
            request.Category.Color,
            request.Category.IncludeToStatistics);

        var subCategoriesToCreate = request.Category.SubCategories.Where(category => category.Id is null).ToList();
        var subCategoriesToUpdate = request.Category.SubCategories.Except(subCategoriesToCreate).ToList();
        var subCategoriesToDelete = existingCategory.SubCategories.Where(category => subCategoriesToUpdate.All(c => c.Id != category.Id)).ToList();

        foreach (var subCategory in subCategoriesToCreate)
        {
            existingCategory.AddSubCategory(subCategory.Name, subCategory.Order);
        }

        foreach (var subCategory in subCategoriesToUpdate)
        {
            existingCategory.UpdateSubCategory(subCategory.Id!.Value, subCategory.Name, subCategory.Order);
        }

        foreach (var subCategory in subCategoriesToDelete)
        {
            existingCategory.RemoveSubCategory(subCategory.Id);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
