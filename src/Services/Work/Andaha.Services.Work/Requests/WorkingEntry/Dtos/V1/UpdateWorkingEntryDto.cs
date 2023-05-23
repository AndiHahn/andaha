namespace Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;

public record UpdateWorkingEntryDto(
    DateTime From,
    DateTime Until,
    TimeSpan Break,
    string? Notes);
