namespace Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;

/// <param name="Entries">All entries of the delivered months, newest first.</param>
/// <param name="NextUntil">Month (yyyy-MM) to continue with, or null if there are no older entries.</param>
public record WorkingEntryMonthsDto(
    IReadOnlyCollection<WorkingEntryDto> Entries,
    string? NextUntil);
