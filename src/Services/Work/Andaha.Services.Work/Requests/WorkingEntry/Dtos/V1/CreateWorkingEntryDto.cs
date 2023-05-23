namespace Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;

public record CreateWorkingEntryDto(
    Guid PersonId,
    DateTime From,
    DateTime Until,
    TimeSpan Break,
    string? Notes);
