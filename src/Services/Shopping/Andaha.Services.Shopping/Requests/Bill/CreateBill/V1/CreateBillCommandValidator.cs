using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;

public class CreateBillCommandValidator : AbstractValidator<CreateBillCommand>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public CreateBillCommandValidator(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));

        RuleFor(command => command.CategoryId).NotNull().NotEmpty();

        RuleFor(command => command.ShopName).NotNull().NotEmpty().MaximumLength(200);

        RuleFor(command => command.Price).GreaterThan(0);

        RuleFor(command => command.Notes).MaximumLength(1000);

        RuleFor(command => command).MustAsync(CategoriesValidAsync);
    }

    private Task<bool> CategoriesValidAsync(CreateBillCommand command, CancellationToken arg2)
    {
        Guid userId = this.identityService.GetUserId();

        return dbContext.BillCategory
            .AnyAsync(
                category => category.UserId == userId &&
                            category.Id == command.CategoryId &&
                            (command.SubCategoryId == null || category.SubCategories.Any(subCategory => subCategory.Id == command.CategoryId)));
    }
}
