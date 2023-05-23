using FluentValidation;

namespace Andaha.Services.Work.Requests.Person.CreatePerson.V1;
internal class CreatePersonRequestValidator : AbstractValidator<CreatePersonRequest>
{
    public CreatePersonRequestValidator()
    {
        RuleFor(command => command.Person.Name).NotNull().NotEmpty().MaximumLength(200);

        RuleFor(command => command.Person.HourlyRate).GreaterThan(-1);
    }
}
