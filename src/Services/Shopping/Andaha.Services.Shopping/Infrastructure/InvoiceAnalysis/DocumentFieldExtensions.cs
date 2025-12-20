namespace Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;

using Azure.AI.DocumentIntelligence;

public static class DocumentFieldExtensions
{
    public static string? GetString(this IReadOnlyDictionary<string, DocumentField> fields, string key)
        => fields.TryGetValue(key, out var f) ? f.ValueString : null;

    public static DateTimeOffset? GetDate(this IReadOnlyDictionary<string, DocumentField> fields, string key)
        => fields.TryGetValue(key, out var f) ? f.ValueDate : null;

    public static decimal? GetDecimal(this IReadOnlyDictionary<string, DocumentField> fields, string key)
        => fields.TryGetValue(key, out var f) ? f.ValueDouble is double d ? (decimal)d : null : null;

    public static CurrencyValue? GetCurrency(this IReadOnlyDictionary<string, DocumentField> fields, string key)
        => fields.TryGetValue(key, out var f) ? f.ValueCurrency : null;
}
