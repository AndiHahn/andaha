using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillCategory.Services;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillCategory.DeleteBillCategory.V1;

internal class DeleteBillCategoryCommandHandler : IRequestHandler<DeleteBillCategoryCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public DeleteBillCategoryCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(DeleteBillCategoryCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var category = await dbContext.BillCategory
            .Where(category => category.UserId == userId)
            .FirstOrDefaultAsync(category => category.Id == request.Id, cancellationToken);

        if (category is null)
        {
            return Results.NotFound();
        }

        if (category.IsDefault)
        {
            return Results.BadRequest(new ProblemDetails
            {
                Title = "Default category cannot be deleted",
                Detail = "Die Standardkategorie kann nicht gelöscht werden.",
            });
        }

        await RemoveTemplatesAndHiddenSuggestionsAsync(request.Id, cancellationToken);

        // Bills of every user in this category (also those of connected users) move to their owner's default category.
        await BillCategoryReassignment.MoveBillsToOwnersDefaultCategoryAsync(dbContext, new[] { request.Id }, cancellationToken);

        dbContext.BillCategory.Remove(category);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    // No cascade delete on these relations (multiple cascade paths), so clean up explicitly.
    private async Task RemoveTemplatesAndHiddenSuggestionsAsync(
        Guid removedCategoryId,
        CancellationToken cancellationToken)
    {
        var templates = await this.dbContext.BillTemplate
            .Where(template => template.CategoryId == removedCategoryId)
            .ToListAsync(cancellationToken);

        var hiddenSuggestions = await this.dbContext.HiddenBillSuggestion
            .Where(suggestion => suggestion.CategoryId == removedCategoryId)
            .ToListAsync(cancellationToken);

        this.dbContext.BillTemplate.RemoveRange(templates);
        this.dbContext.HiddenBillSuggestion.RemoveRange(hiddenSuggestions);
    }
}
