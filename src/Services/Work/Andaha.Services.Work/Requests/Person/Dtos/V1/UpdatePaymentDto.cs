namespace Andaha.Services.Work.Requests.Person.Dtos.V1;

/// <summary>
/// Same fields and units as <see cref="PayPersonDto"/>.
/// </summary>
public record UpdatePaymentDto(
    TimeSpan PayedHours,
    double PayedMoney,
    double PayedTip,
    string? Notes);
