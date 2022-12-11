using System.Globalization;

namespace Andaha.Services.Shopping.Common;

public static class StringExtensions
{
    public static double ToDouble(this string value)
    {
        string valueWithDotDecimal = value.Replace(",", ".");

        if (!double.TryParse(valueWithDotDecimal, NumberStyles.Any, CultureInfo.InvariantCulture, out double parsedValue))
        {
            throw new ArgumentException($"Could not parse value '{value}' to double.");
        }

        return parsedValue;
    }
}
