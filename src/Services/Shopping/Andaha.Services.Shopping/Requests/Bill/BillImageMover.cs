using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

namespace Andaha.Services.Shopping.Requests.Bill;

/// <summary>Moves the stored images of a bill to the structured path matching its current date and shop.</summary>
internal static class BillImageMover
{
    /// <summary>
    /// Copies each image whose target path differs to the new path and renames it (not yet saved).
    /// Returns the old blob names to delete after the save. Legacy names without a path are skipped.
    /// </summary>
    public static async Task<IReadOnlyList<string>> CopyToNewPathsAsync(
        Core.Bill bill, IImageRepository imageRepository, ILogger logger, CancellationToken cancellationToken)
    {
        var oldNames = new List<string>();

        foreach (var image in bill.Images)
        {
            string oldName = image.Name;
            if (BillImagePath.IsLegacy(oldName))
            {
                continue;
            }

            string newName = BillImagePath.ForBill(
                bill.UserId, bill.Date, bill.ShopName, bill.Id, BillImagePath.NumberOf(oldName), BillImagePath.ExtensionOf(oldName));
            if (newName == oldName)
            {
                continue;
            }

            try
            {
                await imageRepository.CopyImageAsync(oldName, newName, cancellationToken);
            }
            catch (FileNotFoundException)
            {
                logger.LogWarning("The blob of bill image '{ImageName}' does not exist, so it is not moved. Keeping its name.", oldName);

                continue;
            }

            image.Rename(newName);
            oldNames.Add(oldName);
        }

        return oldNames;
    }

    // Runs after the save, so it must not be cancelled by the request token (that would leave an orphaned old blob).
    public static async Task DeleteOldAsync(
        IEnumerable<string> oldNames, IImageRepository imageRepository, ILogger logger)
    {
        foreach (string oldName in oldNames)
        {
            try
            {
                await imageRepository.DeleteImageAsync(oldName, CancellationToken.None);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogWarning(exception, "The moved bill image '{ImageName}' could not be deleted.", oldName);
            }
        }
    }
}
