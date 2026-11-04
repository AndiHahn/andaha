using FluentValidation;

namespace Andaha.Services.Shopping.Requests.Bill.DeleteAnalyzedBill.V1;

public class DeleteAnalyzedBillCommandValidator : AbstractValidator<DeleteAnalyzedBillCommand>
{
    public DeleteAnalyzedBillCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
    }
}
