using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Bill.Commands.UpdateBill;

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

        RuleFor(command => command.CategoryId).NotNull().NotEmpty().MustAsync(CategoryAvailable);

        RuleFor(command => command.ShopName).NotNull().NotEmpty().MaximumLength(200);

        RuleFor(command => command.Price).GreaterThan(0);

        RuleFor(command => command.Notes).MaximumLength(1000);
    }

    private Task<bool> CategoryAvailable(Guid categoryId, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        return this.dbContext.BillCategory
            .AnyAsync(
                category => category.UserId == userId &&
                            category.Id == categoryId);
    }
}
