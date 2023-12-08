using ClosedXML.Attributes;

namespace Andaha.Services.Shopping.Requests.Expense.Dtos.V1;

internal record ExportRow
{
    [XLColumn(Header = "Datum", Order = 1)]
    public required DateTime Date { get; init; }

    [XLColumn(Header = "Shop Name", Order = 2)]
    public required string ShopName { get; init; }

    [XLColumn(Header = "Kategorie", Order = 3)]
    public required string Category { get; init; }

    [XLColumn(Header = "Unterkategorie", Order = 4)]
    public string? SubCategory { get; init; }

    [XLColumn(Header = "Preis", Order = 5)]
    public required double Price { get; init; }

    [XLColumn(Header = "Bild vorhanden", Order = 6)]
    public required string ImageAvailable { get; init; }

    [XLColumn(Header = "Notiz", Order = 7)]
    public string? Notes { get; init; }
}
