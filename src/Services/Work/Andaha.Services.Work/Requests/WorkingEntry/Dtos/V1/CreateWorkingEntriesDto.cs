namespace Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;

public record CreateWorkingEntriesDto(
    IReadOnlyCollection<Guid> PersonIds,
    DateTime From,
    DateTime Until,
    TimeSpan Break,
    string? Notes);
