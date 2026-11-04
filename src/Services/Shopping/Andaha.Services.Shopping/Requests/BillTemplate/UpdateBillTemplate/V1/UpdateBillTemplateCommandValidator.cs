using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplate.V1;

public class UpdateBillTemplateCommandValidator : AbstractValidator<UpdateBillTemplateCommand>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateBillTemplateCommandValidator(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));

        RuleFor(command => command.Name).MaximumLength(100);

        RuleFor(command => command.ShopName).MaximumLength(200);

        RuleFor(command => command)
            .MustAsync(CategoriesValidAsync)
            .WithMessage("Category or sub category is not valid.");
    }

    private Task<bool> CategoriesValidAsync(UpdateBillTemplateCommand command, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        return dbContext.BillCategory
            .AnyAsync(
                category => category.UserId == userId &&
                            category.Id == command.CategoryId &&
                            (command.SubCategoryId == null || category.SubCategories.Any(subCategory => subCategory.Id == command.SubCategoryId)),
                cancellationToken);
    }
}
