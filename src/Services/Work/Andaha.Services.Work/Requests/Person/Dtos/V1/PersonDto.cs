using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;

namespace Andaha.Services.Work.Requests.Person.Dtos.V1;

public record PersonDto(
    Guid Id,
    string Name,
    double HourlyRate,
    double PayedHours,
    DateTime? LastPayed,
    string? Notes,
    ICollection<WorkingEntryDto> WorkingEntries);
