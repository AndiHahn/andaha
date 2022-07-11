using FluentValidation;

namespace Andaha.Services.Shopping.Application.DeleteBill;

public class DeleteBillCommandValidator : AbstractValidator<DeleteBillCommand>
{
    public DeleteBillCommandValidator()
    {
        RuleFor(command => command.BillId).NotEmpty();
    }
}
