using FluentValidation;

namespace Andaha.Services.Shopping.Application.Commands.CreateBill;

public class CreateBillCommandValidator : AbstractValidator<CreateBillCommand>
{
    public CreateBillCommandValidator()
    {
        RuleFor(command => command.CategoryId).NotNull().NotEmpty();

        RuleFor(command => command.ShopName).NotNull().NotEmpty().MaximumLength(200);

        RuleFor(command => command.Price).GreaterThan(0);

        RuleFor(command => command.Notes).MaximumLength(1000);
    }
}
