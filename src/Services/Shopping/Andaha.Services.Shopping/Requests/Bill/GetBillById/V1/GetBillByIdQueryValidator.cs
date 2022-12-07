using FluentValidation;

namespace Andaha.Services.Shopping.Requests.Bill.GetBillById.V1;

public class GetBillByIdQueryValidator : AbstractValidator<GetBillByIdQuery>
{
    public GetBillByIdQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty();
    }
}
