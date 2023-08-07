using System.Linq.Expressions;

namespace Andaha.Services.Work.Requests.Person.Dtos.V1;

internal static class PersonDtoMapping
{
    public static Expression<Func<Core.Person, Guid, PersonDto>> EntityToDto =
        (person, currentUserId) => new PersonDto(
            person.Id,
            person.Name,
            person.HourlyRate,
            string.Join("\n", person.Payments.Select(payment => $"{payment.PayedAt.ToShortDateString()} {new TimeSpan(payment.PayedHoursTicks).TotalHours}h ({payment.PayedMoney}€ + {payment.PayedTip}€)")),
            new TimeSpan(person.WorkingEntries.Sum(entry => entry.WorkDurationTicks)),
            new TimeSpan(person.Payments.Sum(payment => payment.PayedHoursTicks)));
}
