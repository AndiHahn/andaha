using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.DeleteAnalyzedBill.V1;

internal class DeleteAnalyzedBillCommandHandler(
    ShoppingDbContext dbContext,
    IIdentityService identityService,
    IImageRepository imageRepository) : IRequestHandler<DeleteAnalyzedBillCommand, IResult>
{
    public async Task<IResult> Handle(DeleteAnalyzedBillCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        // Analyzed bills are private to their creator (no collaboration sharing); a foreign entry is reported as unknown.
        var analyzedBill = await dbContext.AnalyzedBill
            .Include(bill => bill.Images)
            .Include(bill => bill.LineItems)
            .FirstOrDefaultAsync(bill => bill.Id == request.Id && bill.UserId == userId, cancellationToken);
        if (analyzedBill is null)
        {
            return Results.NotFound($"Analyzed bill with id {request.Id} not found.");
        }

        var imageNames = analyzedBill.Images.Select(image => image.Name).ToList();

        dbContext.BillImage.RemoveRange(analyzedBill.Images);
        dbContext.AnalyzedBill.Remove(analyzedBill);

        await dbContext.SaveChangesAsync(cancellationToken);

        foreach (var imageName in imageNames)
        {
            await imageRepository.DeleteImageAsync(imageName, cancellationToken);
        }

        return Results.NoContent();
    }
}
