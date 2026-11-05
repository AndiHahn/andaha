using Andaha.Services.Work.Common;
using FluentValidation;
using System.Globalization;

namespace Andaha.Services.Work.Requests.Statistics.GetMonthlyHours.V1;

public class GetMonthlyHoursQueryValidator : AbstractValidator<GetMonthlyHoursQuery>
{
    public GetMonthlyHoursQueryValidator()
    {
        this.RuleFor(query => query.Months).InclusiveBetween(1, 24);

        this.RuleFor(query => query.Until)
            .Must(until => until is not null &&
                           DateTime.TryParseExact(until, "yyyy-MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            .WithMessage("'Until' must be a month in the format yyyy-MM.");

        this.RuleFor(query => query.Tz)
            .Must(LocalMonths.IsKnownTimeZone)
            .WithMessage("'Tz' must be a known IANA time zone id.");
    }
}
