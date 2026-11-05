using System.Globalization;

namespace Andaha.Services.Work.Common;

/// <summary>
/// Calendar months in the user's time zone. Working entries are stored as UTC instants, but a month
/// ("yyyy-MM") is meant as the user's local month, so an entry on the 1st at 00:30 local time belongs
/// to that month even though its UTC instant lies in the previous one.
/// </summary>
internal static class LocalMonths
{
    public const string DefaultTimeZoneId = "Europe/Vienna";

    public const string Format = "yyyy-MM";

    public static bool IsKnownTimeZone(string? timeZoneId)
        => timeZoneId is null || TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId, out _);

    /// <summary>
    /// The time zone with the given IANA id, or <see cref="DefaultTimeZoneId"/> if none is given.
    /// </summary>
    public static TimeZoneInfo ResolveTimeZone(string? timeZoneId)
        => TimeZoneInfo.FindSystemTimeZoneById(timeZoneId ?? DefaultTimeZoneId);

    /// <summary>
    /// First day of the month in the format yyyy-MM, as a date without time zone.
    /// </summary>
    public static DateTime Parse(string month)
        => DateTime.ParseExact(month, Format, CultureInfo.InvariantCulture);

    public static string ToMonthString(DateTime monthStart)
        => monthStart.ToString(Format, CultureInfo.InvariantCulture);

    /// <summary>
    /// The UTC instant at which the local month starting at <paramref name="monthStart"/> begins.
    /// </summary>
    public static DateTime StartUtc(DateTime monthStart, TimeZoneInfo timeZone)
    {
        var local = DateTime.SpecifyKind(new DateTime(monthStart.Year, monthStart.Month, 1), DateTimeKind.Unspecified);

        // In zones that switch to daylight saving time at midnight, the local midnight does not exist.
        while (timeZone.IsInvalidTime(local))
        {
            local = local.AddMinutes(15);
        }

        return TimeZoneInfo.ConvertTimeToUtc(local, timeZone);
    }

    /// <summary>
    /// First day of the local month the UTC instant <paramref name="utc"/> falls into.
    /// </summary>
    public static DateTime MonthOf(DateTime utc, TimeZoneInfo timeZone)
    {
        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), timeZone);

        return new DateTime(local.Year, local.Month, 1);
    }
}
