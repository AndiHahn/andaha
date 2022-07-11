using FluentValidation;

namespace Andaha.Services.Shopping.Application.GetBillById;

public class GetBillByIdQueryValidator : AbstractValidator<GetBillByIdQuery>
{
    public GetBillByIdQueryValidator()
    {
        RuleFor(query => query.BillId).NotEmpty();
    }
}
