using FluentValidation;

namespace Andaha.Services.Work.Requests.Person.UpdatePerson.V1;

internal class UpdatePersonRequestValidator : AbstractValidator<UpdatePersonRequest>
{
    public UpdatePersonRequestValidator()
    {
        RuleFor(command => command.Id).NotNull().NotEmpty();

        RuleFor(command => command.UpdatePerson.Name).NotNull().NotEmpty().MaximumLength(200);

        RuleFor(command => command.UpdatePerson.HourlyRate).GreaterThan(-1);
    }
}