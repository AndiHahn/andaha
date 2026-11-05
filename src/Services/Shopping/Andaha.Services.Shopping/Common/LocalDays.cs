namespace Andaha.Services.Shopping.Common;

/// <summary>
/// Local calendar days for an IANA time zone (<c>tz</c> query parameter), as in the Work service (US-0008).
/// </summary>
internal static class LocalDays
{
    public const string DefaultTimeZoneId = "Europe/Vienna";

    public static bool IsKnownTimeZone(string? timeZoneId)
        => timeZoneId is null || TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId, out _);

    /// <summary>
    /// The time zone with the given IANA id, or <see cref="DefaultTimeZoneId"/> if none is given.
    /// </summary>
    public static TimeZoneInfo ResolveTimeZone(string? timeZoneId)
        => TimeZoneInfo.FindSystemTimeZoneById(timeZoneId ?? DefaultTimeZoneId);

    /// <summary>
    /// The UTC range [start, end) of the local day that contains the instant <paramref name="now"/>.
    /// </summary>
    public static (DateTime StartUtc, DateTime EndUtc) DayOf(DateTimeOffset now, TimeZoneInfo timeZone)
    {
        var localDate = TimeZoneInfo.ConvertTime(now, timeZone).Date;

        return (StartUtc(localDate, timeZone), StartUtc(localDate.AddDays(1), timeZone));
    }

    /// <summary>
    /// The UTC instant at which the local day <paramref name="localDate"/> begins.
    /// </summary>
    private static DateTime StartUtc(DateTime localDate, TimeZoneInfo timeZone)
    {
        var local = DateTime.SpecifyKind(localDate.Date, DateTimeKind.Unspecified);

        // In zones that switch to daylight saving time at midnight, the local midnight does not exist.
        while (timeZone.IsInvalidTime(local))
        {
            local = local.AddMinutes(15);
        }

        return TimeZoneInfo.ConvertTimeToUtc(local, timeZone);
    }
}
