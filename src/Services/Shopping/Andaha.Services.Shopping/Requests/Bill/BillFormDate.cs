using System.Globalization;

namespace Andaha.Services.Shopping.Requests.Bill;

/// <summary>
/// Date of a bill as sent by the app (multipart form): the local wall time of the user, e.g.
/// "2026-11-05T23:30:00.000". It is stored unchanged so that the bill keeps the calendar day the user picked.
/// Older app versions mark the same wall time as UTC ("…Z"); that marker must not shift the value by the
/// server time zone either, which a plain <see cref="DateTime.Parse(string)"/> would do.
/// </summary>
internal static class BillFormDate
{
    public static DateTime Parse(string value)
        => DateTime.Parse(
            value,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
}
