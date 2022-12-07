using FluentValidation;

namespace Andaha.Services.Shopping.Requests.Bill.DeleteBill.V1;

public class DeleteBillCommandValidator : AbstractValidator<DeleteBillCommand>
{
    public DeleteBillCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
    }
}
