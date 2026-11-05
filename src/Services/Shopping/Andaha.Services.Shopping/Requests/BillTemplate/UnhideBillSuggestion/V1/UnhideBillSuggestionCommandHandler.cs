using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.UnhideBillSuggestion.V1;

internal class UnhideBillSuggestionCommandHandler(
    ShoppingDbContext dbContext,
    IIdentityService identityService) : IRequestHandler<UnhideBillSuggestionCommand, IResult>
{
    public async Task<IResult> Handle(UnhideBillSuggestionCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        // A hidden suggestion of another user is reported as unknown.
        var hiddenSuggestion = await dbContext.HiddenBillSuggestion
            .FirstOrDefaultAsync(suggestion => suggestion.UserId == userId && suggestion.Id == request.Id, cancellationToken);

        if (hiddenSuggestion is null)
        {
            return Results.NotFound();
        }

        dbContext.HiddenBillSuggestion.Remove(hiddenSuggestion);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
