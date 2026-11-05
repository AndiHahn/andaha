using FluentValidation;

namespace Andaha.Services.Work.Requests.WorkingEntry.CreateWorkingEntries.V1;

public class CreateWorkingEntriesRequestValidator : AbstractValidator<CreateWorkingEntriesRequest>
{
    public CreateWorkingEntriesRequestValidator()
    {
        this.RuleFor(request => request.WorkingEntries.PersonIds).NotEmpty();

        this.RuleFor(request => request.WorkingEntries.Until)
            .GreaterThan(request => request.WorkingEntries.From)
            .WithMessage("'Until' must be after 'From'.")
            .OverridePropertyName("Until");

        this.RuleFor(request => request.WorkingEntries.Break)
            .Must((request, @break) => @break < request.WorkingEntries.Until - request.WorkingEntries.From)
            .When(request => request.WorkingEntries.Until > request.WorkingEntries.From)
            .WithMessage("'Break' must be shorter than the working time.")
            .OverridePropertyName("Break");
    }
}
