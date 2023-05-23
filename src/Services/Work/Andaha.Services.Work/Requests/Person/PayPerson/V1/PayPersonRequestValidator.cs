using FluentValidation;

namespace Andaha.Services.Work.Requests.Person.PayPerson.V1;

public class PayPersonRequestValidator : AbstractValidator<PayPersonRequest>
{
    public PayPersonRequestValidator()
    {
        this.RuleFor(command => command.Id).NotNull().NotEmpty();

        this.RuleFor(command => command.PayedHours).NotNull().NotEmpty().GreaterThan(0);
    }
}
