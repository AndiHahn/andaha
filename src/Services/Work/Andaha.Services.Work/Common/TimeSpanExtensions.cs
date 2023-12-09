namespace Andaha.Services.Work.Common;

public static class TimeSpanExtensions
{
    public static string ToFormattedString(this TimeSpan timeSpan) =>
        $"{((int)timeSpan.TotalHours < 10 ? ((int)timeSpan.TotalHours).ToString("00") : (int)timeSpan.TotalHours)}:" +
        $"{(timeSpan.Minutes < 10 ? timeSpan.Minutes.ToString("00") : timeSpan.Minutes)}";
}
