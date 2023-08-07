namespace Andaha.Services.Work.Requests.Person.Dtos.V1;

public record PersonDto(
    Guid Id,
    string Name,
    double HourlyRate,
    string? Notes,
    TimeSpan TotalHours,
    TimeSpan PayedHours);
