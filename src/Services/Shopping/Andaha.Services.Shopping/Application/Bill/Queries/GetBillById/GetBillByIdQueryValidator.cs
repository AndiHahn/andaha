using FluentValidation;

namespace Andaha.Services.Shopping.Application.Queries.GetBillById;

public class GetBillByIdQueryValidator : AbstractValidator<GetBillByIdQuery>
{
    public GetBillByIdQueryValidator()
    {
        RuleFor(query => query.BillId).NotEmpty();
    }
}
