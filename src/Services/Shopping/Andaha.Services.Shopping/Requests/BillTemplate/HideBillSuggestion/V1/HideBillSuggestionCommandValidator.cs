using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.HideBillSuggestion.V1;

public class HideBillSuggestionCommandValidator : AbstractValidator<HideBillSuggestionCommand>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public HideBillSuggestionCommandValidator(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));

        RuleFor(command => command.ShopName)
            .NotEmpty()
            .Must(shopName => shopName.Trim().Length is > 0 and <= 200)
            .WithMessage("Shop name must not be empty or longer than 200 characters.");

        RuleFor(command => command)
            .MustAsync(CategoriesValidAsync)
            .WithMessage("Category or sub category is not valid.");
    }

    private Task<bool> CategoriesValidAsync(HideBillSuggestionCommand command, CancellationToken cancellationToken)
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
