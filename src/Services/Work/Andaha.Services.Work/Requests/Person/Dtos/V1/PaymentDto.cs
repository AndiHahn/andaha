namespace Andaha.Services.Work.Requests.Person.Dtos.V1;

public record PaymentDto(
    Guid Id,
    DateTime PayedAt,
    TimeSpan PayedHours,
    double PayedMoney,
    double PayedTip,
    string? Notes);
