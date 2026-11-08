using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

/// <summary>Builds the structured blob names (without the "bills/" container prefix).</summary>
public static partial class BillImagePath
{
    private const int MaxSlugLength = 40;
    private const string UnknownShop = "Unbekannt";

    public static string ShopSlug(string? shopName)
    {
        if (string.IsNullOrWhiteSpace(shopName))
        {
            return UnknownShop;
        }

        var replaced = shopName
            .Replace("ä", "ae").Replace("ö", "oe").Replace("ü", "ue")
            .Replace("Ä", "Ae").Replace("Ö", "Oe").Replace("Ü", "Ue")
            .Replace("ß", "ss");

        var sb = new StringBuilder(replaced.Length);
        foreach (var c in replaced.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        var slug = InvalidRuns().Replace(sb.ToString(), "-").Trim('-');
        if (slug.Length > MaxSlugLength)
        {
            slug = slug[..MaxSlugLength].TrimEnd('-');
        }

        return slug.Length == 0 ? UnknownShop : slug;
    }

    public static string ForBill(Guid userId, DateTime date, string? shopName, Guid billId, int number, string extension)
        => string.Create(
            CultureInfo.InvariantCulture,
            $"{userId:D}/{date:yyyy}/{date:MM}/{date:yyyy-MM-dd}_{ShopSlug(shopName)}_{billId:D}-{number}{extension}");

    public static string ForScan(Guid userId, DateTime createdAtUtc, Guid analyzedBillId, string extension)
        => string.Create(
            CultureInfo.InvariantCulture,
            $"{userId:D}/offen/{createdAtUtc:yyyy-MM-dd_HH-mm-ss}_{analyzedBillId:D}-1{extension}");

    public static bool IsLegacy(string name) => !name.Contains('/');

    public static string ExtensionOf(string name)
        => IsLegacy(name) ? string.Empty : Path.GetExtension(name);

    [GeneratedRegex("[^A-Za-z0-9]+")]
    private static partial Regex InvalidRuns();
}
