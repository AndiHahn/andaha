namespace Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;

public record WorkingEntryDto(
    Guid Id,
    DateTime From,
    DateTime Until,
    TimeSpan Break,
    string? Notes);
