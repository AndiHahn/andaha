using FluentValidation;

namespace Andaha.Services.Shopping.Requests.Bill.SearchBills.V1;

public class SearchBillsQueryValidator : AbstractValidator<SearchBillsQuery>
{
    public SearchBillsQueryValidator()
    {
        RuleFor(query => query.PageSize).GreaterThan(0);

        RuleFor(query => query.PageIndex).GreaterThanOrEqualTo(0);
    }
}
