using FluentValidation;
using System.Globalization;

namespace Andaha.Services.Shopping.Requests.Expense.GetMonthlyExpenses.V1;

public class GetMonthlyExpensesQueryValidator : AbstractValidator<GetMonthlyExpensesQuery>
{
    public GetMonthlyExpensesQueryValidator()
    {
        RuleFor(query => query.Months).InclusiveBetween(1, 24);

        RuleFor(query => query.Until)
            .Must(until => until is not null &&
                           DateTime.TryParseExact(until, "yyyy-MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            .WithMessage("'Until' must be a month in the format yyyy-MM.");
    }
}
