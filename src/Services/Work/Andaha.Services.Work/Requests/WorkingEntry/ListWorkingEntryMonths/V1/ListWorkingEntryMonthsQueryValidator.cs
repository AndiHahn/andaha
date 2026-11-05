using Andaha.Services.Work.Common;
using FluentValidation;
using System.Globalization;

namespace Andaha.Services.Work.Requests.WorkingEntry.ListWorkingEntryMonths.V1;

public class ListWorkingEntryMonthsQueryValidator : AbstractValidator<ListWorkingEntryMonthsQuery>
{
    public ListWorkingEntryMonthsQueryValidator()
    {
        this.RuleFor(query => query.PersonId).NotEmpty();

        this.RuleFor(query => query.Months).InclusiveBetween(1, 24);

        this.RuleFor(query => query.Until)
            .Must(until => DateTime.TryParseExact(until, "yyyy-MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            .When(query => query.Until is not null)
            .WithMessage("'Until' must be a month in the format yyyy-MM.");

        this.RuleFor(query => query.Tz)
            .Must(LocalMonths.IsKnownTimeZone)
            .WithMessage("'Tz' must be a known IANA time zone id.");
    }
}
