using System.Text.Json;

namespace Andaha.Services.Shopping.Requests.Bill.LineItems;

/// <summary>
/// The optional multipart form field <c>lineItems</c> of <c>POST</c>/<c>PUT api/bill</c>: a JSON string
/// <c>[{ description, quantity, unitPrice, totalPrice }]</c> in display order.
/// </summary>
internal static class LineItemsFormField
{
    public const string Name = "lineItems";

    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private sealed record RawLineItem(string? Description, int? Quantity, double? UnitPrice, double? TotalPrice);

    /// <summary>
    /// Reads the field. A missing field gives <c>true</c> with <paramref name="lineItems"/> <c>null</c> (keep the
    /// stored items); anything that is not a JSON array of line item objects gives <c>false</c>.
    /// Descriptions are passed on as sent (a missing one as empty string), the validator checks them.
    /// </summary>
    public static bool TryRead(IFormCollection form, out IReadOnlyList<LineItemData>? lineItems)
    {
        lineItems = null;

        if (!form.TryGetValue(Name, out var values))
        {
            return true;
        }

        if (values.Count != 1 || string.IsNullOrWhiteSpace(values[0]))
        {
            return false;
        }

        RawLineItem?[]? raw;
        try
        {
            raw = JsonSerializer.Deserialize<RawLineItem?[]>(values[0]!, SerializerOptions);
        }
        catch (JsonException)
        {
            return false;
        }

        if (raw is null || raw.Any(item => item is null))
        {
            return false;
        }

        lineItems = raw
            .Select(item => new LineItemData(item!.Description ?? string.Empty, item.Quantity, item.UnitPrice, item.TotalPrice))
            .ToArray();

        return true;
    }

    public static IResult InvalidResult()
        => TypedResults.ValidationProblem(new Dictionary<string, string[]>
        {
            [Name] = ["Die Positionen sind kein gültiges JSON-Array."],
        });
}
