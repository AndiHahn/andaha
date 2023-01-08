using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.UpdateBill.V1;

public class UpdateBillCommandValidator : AbstractValidator<UpdateBillCommand>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateBillCommandValidator(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));

        RuleFor(command => command.Id).NotEmpty();

        RuleFor(command => command.CategoryId).NotNull().NotEmpty();

        RuleFor(command => command.ShopName).NotNull().NotEmpty().MaximumLength(200);

        RuleFor(command => command.Price).GreaterThan(0);

        RuleFor(command => command.Notes).MaximumLength(1000);

        RuleFor(command => command).MustAsync(CategoriesValidAsync);
    }

    private Task<bool> CategoriesValidAsync(UpdateBillCommand command, CancellationToken arg2)
    {
        Guid userId = this.identityService.GetUserId();

        return dbContext.BillCategory
            .AnyAsync(
                category => category.UserId == userId &&
                            category.Id == command.CategoryId &&
                            (command.SubCategoryId == null || category.SubCategories.Any(subCategory => subCategory.Id == command.CategoryId)));
    }
}
