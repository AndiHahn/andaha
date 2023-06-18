namespace Andaha.Services.Work.Requests.Person.Dtos.V1;

public record PayPersonDto(
    double PayedHours,
    double PayedMoney,
    double PayedTip = 0.0);
