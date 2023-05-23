using System.Linq.Expressions;

namespace Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;

internal static class WorkingEntryDtoMapping
{
    public static Expression<Func<Core.WorkingEntry, WorkingEntryDto>> EntityToDto =
        (workingEntry) => new WorkingEntryDto(
            workingEntry.From,
            workingEntry.Until,
            workingEntry.Break,
            workingEntry.Notes);
}
