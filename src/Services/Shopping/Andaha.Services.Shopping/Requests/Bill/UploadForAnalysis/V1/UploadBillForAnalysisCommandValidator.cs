using FluentValidation;

namespace Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;

public class UploadBillForAnalysisCommandValidator : AbstractValidator<UploadBillForAnalysisCommand>
{
    public UploadBillForAnalysisCommandValidator()
    {
        RuleFor(command => command.Id)
            .Must(id => Guid.TryParse(id, out _))
            .When(command => command.Id is not null)
            .WithMessage("'id' must be a GUID.");
    }
}
