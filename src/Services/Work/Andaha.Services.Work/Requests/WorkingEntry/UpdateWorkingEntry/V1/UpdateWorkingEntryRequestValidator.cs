using FluentValidation;

namespace Andaha.Services.Work.Requests.WorkingEntry.UpdateWorkingEntry.V1;

public class UpdateWorkingEntryRequestValidator : AbstractValidator<UpdateWorkingEntryRequest>
{
    public UpdateWorkingEntryRequestValidator()
    {
        this.RuleFor(request => request.Id).NotEmpty();

        this.RuleFor(request => request.WorkingEntry.Until)
            .GreaterThan(request => request.WorkingEntry.From)
            .WithMessage("'Until' must be after 'From'.")
            .OverridePropertyName("Until");

        this.RuleFor(request => request.WorkingEntry.Break)
            .Must((request, @break) => @break < request.WorkingEntry.Until - request.WorkingEntry.From)
            .When(request => request.WorkingEntry.Until > request.WorkingEntry.From)
            .WithMessage("'Break' must be shorter than the working time.")
            .OverridePropertyName("Break");
    }
}
