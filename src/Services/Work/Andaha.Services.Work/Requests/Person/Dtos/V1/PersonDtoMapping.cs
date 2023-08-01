using System.Linq.Expressions;

namespace Andaha.Services.Work.Requests.Person.Dtos.V1;

internal static class PersonDtoMapping
{
    public static Expression<Func<Core.Person, Guid, PersonDto>> EntityToDto =
        (person, currentUserId) => new PersonDto(
            person.Id,
            person.Name,
            person.HourlyRate,
            person.Notes,
            new TimeSpan(person.WorkingEntries.Sum(entry => entry.WorkDurationTicks)),
            new TimeSpan(person.PayedHoursTicks),
            person.LastPayed);
}
