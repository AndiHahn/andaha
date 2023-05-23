namespace Andaha.Services.Work.Requests.Person.Dtos.V1;

public record CreatePersonDto(string Name, double HourlyRate, string? Notes);
