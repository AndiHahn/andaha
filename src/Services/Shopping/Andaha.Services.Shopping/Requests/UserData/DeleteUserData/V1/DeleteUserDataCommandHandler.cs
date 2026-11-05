using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Requests.BillCategory.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.UserData.DeleteUserData.V1;

/// <summary>
/// Deletes all shopping data of the signed-in user. Idempotent: a repeated call deletes whatever is left.
/// Data of connected users stays; their bills in the user's categories move to their own default category.
/// </summary>
internal class DeleteUserDataCommandHandler(
    ShoppingDbContext dbContext,
    IIdentityService identityService,
    IImageRepository imageRepository,
    IAnalysisImageRepository analysisImageRepository,
    ILogger<DeleteUserDataCommandHandler> logger) : IRequestHandler<DeleteUserDataCommand, IResult>
{
    public async Task<IResult> Handle(DeleteUserDataCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        // Blobs go first: if the database part fails afterwards, the rows still name the images for the next call.
        await DeleteImageBlobsAsync(userId, cancellationToken);
        await DeletePendingAnalysisUploadsAsync(userId, cancellationToken);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Own bills go before the reassignment, so only bills of other users are moved and no default
        // category is seeded for the user being deleted.
        await DeleteBillsAndAnalyzedBillsAsync(userId, cancellationToken);
        await DeleteCategoriesAsync(userId, cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return Results.NoContent();
    }

    private async Task DeleteImageBlobsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var imageNames = await OwnBillImages(userId)
            .Select(image => image.Name)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var imageName in imageNames)
        {
            await TryDeleteBlobAsync(
                () => imageRepository.DeleteImageAsync(imageName, cancellationToken), "images", imageName, userId);
        }
    }

    private async Task DeletePendingAnalysisUploadsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var uploads = await analysisImageRepository.ListImagesAsync(cancellationToken);

        foreach (var upload in uploads.Where(upload => upload.UserId == userId))
        {
            await TryDeleteBlobAsync(
                () => analysisImageRepository.DeleteImageAsync(upload.ImageName, cancellationToken), "analysis", upload.ImageName, userId);
        }
    }

    private async Task DeleteBillsAndAnalyzedBillsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var ownBillIds = dbContext.Bill.Where(bill => bill.UserId == userId).Select(bill => bill.Id);
        var ownAnalyzedBillIds = dbContext.AnalyzedBill.Where(bill => bill.UserId == userId).Select(bill => bill.Id);

        await OwnBillImages(userId).ExecuteDeleteAsync(cancellationToken);

        await dbContext.BillLineItem
            .Where(lineItem => ownBillIds.Contains(lineItem.BillId))
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.Bill
            .Where(bill => bill.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.AnalyzedBillLineItem
            .Where(lineItem => ownAnalyzedBillIds.Contains(lineItem.BillId))
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.AnalyzedBill
            .Where(bill => bill.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);
    }

    private async Task DeleteCategoriesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var categoryIds = await dbContext.BillCategory
            .Where(category => category.UserId == userId)
            .Select(category => category.Id)
            .ToListAsync(cancellationToken);

        // Bills of connected users in these categories move to their owner's default category.
        await BillCategoryReassignment.MoveBillsToOwnersDefaultCategoryAsync(dbContext, categoryIds, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Templates and hidden suggestions have no cascade (multiple cascade paths): the own ones, and any
        // that still point at one of the categories, as when a single category is deleted.
        await dbContext.BillTemplate
            .Where(template => template.UserId == userId || categoryIds.Contains(template.CategoryId))
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.HiddenBillSuggestion
            .Where(suggestion => suggestion.UserId == userId || categoryIds.Contains(suggestion.CategoryId))
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.BillSubCategory
            .Where(subCategory => categoryIds.Contains(subCategory.CategoryId))
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.BillCategory
            .Where(category => categoryIds.Contains(category.Id))
            .ExecuteDeleteAsync(cancellationToken);
    }

    private IQueryable<Core.BillImage> OwnBillImages(Guid userId)
    {
        var ownBillIds = dbContext.Bill.Where(bill => bill.UserId == userId).Select(bill => (Guid?)bill.Id);
        var ownAnalyzedBillIds = dbContext.AnalyzedBill.Where(bill => bill.UserId == userId).Select(bill => (Guid?)bill.Id);

        return dbContext.BillImage.Where(image =>
            ownBillIds.Contains(image.BillId) || ownAnalyzedBillIds.Contains(image.AnalyzedBillId));
    }

    // A blob that cannot be deleted must not stop the deletion of the user's data; it is logged instead.
    private async Task TryDeleteBlobAsync(Func<Task> deleteBlob, string container, string blobName, Guid userId)
    {
        try
        {
            await deleteBlob();
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(
                exception,
                "Could not delete blob {BlobName} in {Container} while deleting the data of user {UserId}.",
                blobName,
                container,
                userId);
        }
    }
}
