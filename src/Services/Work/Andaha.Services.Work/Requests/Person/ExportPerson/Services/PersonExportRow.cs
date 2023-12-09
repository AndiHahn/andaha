namespace Andaha.Services.Work.Requests.Person.ExportPerson.Definitions;

internal record PersonExportRow
{
    public required string Name { get; init; }

    public required double HourlyRate { get; init; }

    public required string TotalWorkingTime { get; init; }

    public required double TotalPayed { get; init; }

    public required double PayedTip { get; init; }

    public required double OpenPayment { get; init; }
}
