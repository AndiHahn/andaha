using Andaha.Services.Shopping.Common;
using FluentValidation;

namespace Andaha.Services.Shopping.Requests.Bill.GetTodayAutoCreatedBills.V1;

public class GetTodayAutoCreatedBillsQueryValidator : AbstractValidator<GetTodayAutoCreatedBillsQuery>
{
    public GetTodayAutoCreatedBillsQueryValidator()
    {
        this.RuleFor(query => query.Tz)
            .Must(LocalDays.IsKnownTimeZone)
            .WithMessage("'Tz' must be a known IANA time zone id.");
    }
}
