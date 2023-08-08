using System.Text.Json.Serialization;
using System.Text.Json;
using System.Globalization;

namespace Andaha.Services.Work.JsonConverter;

public class TimeSpanConverter : JsonConverter<TimeSpan>
{
    public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var inputTimeString = reader.GetString()!;

        var time = SplitTimeString(inputTimeString);

        if (time.Hours <= 0)
        {
            return TimeSpan.Parse(inputTimeString, CultureInfo.InvariantCulture);
        }

        var days = time.Hours / 24;

        var hoursLeft = time.Hours - (days * 24);

        var timeString = $"{days}.{hoursLeft.ToString("00")}:{time.Minutes.ToString("00")}:{time.Seconds.ToString("00")}";

        var timeSpan = TimeSpan.Parse(timeString, CultureInfo.InvariantCulture);

        return timeSpan;
    }

    public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
    {
        var totalHours = ((int)value.TotalHours).ToString("00");
        var minutes = value.Minutes.ToString("00");
        var seconds = value.Seconds.ToString("00");

        writer.WriteStringValue($"{totalHours}:{minutes}:{seconds}");
    }

    private (int Hours, int Minutes, int Seconds) SplitTimeString(string time)
    {
        var splittedTime = time.Split(":");

        return (int.Parse(splittedTime[0]), int.Parse(splittedTime[1]), int.Parse(splittedTime[2]));
    }
}
