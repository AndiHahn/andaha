using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using LinqKit;
using System.Linq.Expressions;

namespace Andaha.Services.Work.Requests.Person.Dtos.V1;

internal static class PersonDtoMapping
{
    public static Expression<Func<Core.Person, Guid, PersonDto>> EntityToDto =
        (person, currentUserId) => new PersonDto(
            person.Id,
            person.Name,
            person.HourlyRate,
            person.PayedHous,
            person.LastPayed,
            person.Notes,
            person.WorkingEntries.Select(workingEntry => WorkingEntryDtoMapping.EntityToDto.Invoke(workingEntry)).ToArray());
}
