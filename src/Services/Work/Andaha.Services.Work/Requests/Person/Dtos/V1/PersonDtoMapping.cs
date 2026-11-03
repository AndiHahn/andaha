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
            new TimeSpan(person.Payments.Sum(payment => payment.PayedHoursTicks)),
            person.Payments
                .OrderByDescending(payment => payment.PayedAt)
                .Select(payment => new PaymentDto(
                    payment.Id,
                    payment.PayedAt,
                    new TimeSpan(payment.PayedHoursTicks),
                    payment.PayedMoney,
                    payment.PayedTip,
                    payment.Notes))
                .ToList());
}
