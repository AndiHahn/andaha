using System.Text.Json.Serialization;
using System.Text.Json;
using System.Globalization;

namespace Andaha.Services.Work.JsonConverter;

public class TimeSpanConverter : JsonConverter<TimeSpan>
{
    public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        string val = reader.GetString()!;

        return TimeSpan.Parse(val, CultureInfo.InvariantCulture);
    }

    public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
    {
        var totalHours = ((int)value.TotalHours).ToString("00");
        var minutes = value.Minutes.ToString("00");
        var seconds = value.Seconds.ToString("00");

        writer.WriteStringValue($"{totalHours}:{minutes}:{seconds}");
    }
}
