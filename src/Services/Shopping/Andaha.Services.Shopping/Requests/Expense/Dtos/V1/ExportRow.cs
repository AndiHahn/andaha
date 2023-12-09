namespace Andaha.Services.Shopping.Requests.Expense.Dtos.V1;

internal record ExportRow
{
    public required DateTime Date { get; init; }

    public required string ShopName { get; init; }

    public required string Category { get; init; }

    public string? SubCategory { get; init; }

    public required double Price { get; init; }

    public required string ImageAvailable { get; init; }

    public string? Notes { get; init; }
}
