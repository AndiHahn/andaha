using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplateOrder.V1;

public class UpdateBillTemplateOrderCommandValidator : AbstractValidator<UpdateBillTemplateOrderCommand>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateBillTemplateOrderCommandValidator(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));

        RuleFor(command => command.Ids)
            .NotNull()
            .Must(ids => ids.Distinct().Count() == ids.Length)
            .WithMessage("Each template id must only appear once.");

        RuleFor(command => command.Ids)
            .MustAsync(ContainsExactlyOwnTemplatesAsync)
            .When(command => command.Ids is not null)
            .WithMessage("Ids must contain exactly all own templates.");
    }

    private async Task<bool> ContainsExactlyOwnTemplatesAsync(Guid[] ids, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var ownIds = await dbContext.BillTemplate
            .AsNoTracking()
            .Where(template => template.UserId == userId)
            .Select(template => template.Id)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet().SetEquals(ownIds);
    }
}
