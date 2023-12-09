namespace Andaha.Services.Work.Requests.Person.ExportPerson.Services;

internal record WorkingTimeExportRow
{
    public required string Name { get; init; }

    public required string Date { get; init; }

    public required string From { get; init; }

    public required string Until { get; init; }

    public required string Break { get; init; }

    public required string WorkDuration { get; init; }

    public required string? Notes { get; init; }
}
