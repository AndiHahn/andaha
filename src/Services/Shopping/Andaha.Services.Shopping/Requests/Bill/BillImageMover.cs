using System.Globalization;
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
        Core.Bill bill, IImageRepository imageRepository, CancellationToken cancellationToken)
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
                bill.UserId, bill.Date, bill.ShopName, bill.Id, NumberOf(oldName), BillImagePath.ExtensionOf(oldName));
            if (newName == oldName)
            {
                continue;
            }

            await imageRepository.CopyImageAsync(oldName, newName, cancellationToken);
            image.Rename(newName);
            oldNames.Add(oldName);
        }

        return oldNames;
    }

    public static async Task DeleteOldAsync(
        IEnumerable<string> oldNames, IImageRepository imageRepository, ILogger logger, CancellationToken cancellationToken)
    {
        foreach (string oldName in oldNames)
        {
            try
            {
                await imageRepository.DeleteImageAsync(oldName, cancellationToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogWarning(exception, "The moved bill image '{ImageName}' could not be deleted.", oldName);
            }
        }
    }

    // Names end in "-{n}.{ext}"; a move keeps the number.
    private static int NumberOf(string name)
    {
        string stem = Path.GetFileNameWithoutExtension(name);
        int dash = stem.LastIndexOf('-');

        return dash >= 0 && int.TryParse(stem[(dash + 1)..], NumberStyles.None, CultureInfo.InvariantCulture, out int n) ? n : 1;
    }
}
