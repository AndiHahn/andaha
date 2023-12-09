namespace Andaha.Services.Work.Requests.Person.ExportPerson.Services;

public class PaymentExportRow
{
    public required string Name { get; init; }

    public required DateTime PayedAt { get; init; }

    public required string PayedHours { get; init; }

    public required double PayedMoney { get; init; }

    public required double PayedTip { get; init; }

    public required string? Note { get; init; }
}
