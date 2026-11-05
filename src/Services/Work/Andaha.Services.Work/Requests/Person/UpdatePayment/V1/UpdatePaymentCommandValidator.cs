using FluentValidation;

namespace Andaha.Services.Work.Requests.Person.UpdatePayment.V1;

public class UpdatePaymentCommandValidator : AbstractValidator<UpdatePaymentCommand>
{
    public UpdatePaymentCommandValidator()
    {
        this.RuleFor(command => command.PersonId).NotEmpty();

        this.RuleFor(command => command.PaymentId).NotEmpty();

        this.RuleFor(command => command.Payment.PayedHours).GreaterThan(TimeSpan.FromTicks(1));

        this.RuleFor(command => command.Payment.PayedMoney).GreaterThan(0);

        this.RuleFor(command => command.Payment.PayedTip).GreaterThanOrEqualTo(0);
    }
}
