using Andaha.Services.Work.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Statistics.Extensions;

internal static class WorkingTimeQueryExtensions
{
    public static Task<double> GetPayedMoneyAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        CancellationToken cancellationToken)
        => dbContext.Person
            .AsNoTracking()
            .Where(
                person =>
                    person.UserId == userId ||
                    connectedUsers.Contains(person.UserId))
            .SelectMany(
                person => person.Payments
                    .Where(
                        payment =>
                            payment.PayedAt >= startTimeUtc &&
                            payment.PayedAt <= endTimeUtc))
            .SumAsync(payment => payment.PayedMoney, cancellationToken);

    public static Task<long> GetWorkingTimeAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        CancellationToken cancellationToken)
        => dbContext.WorkingEntry
            .AsNoTracking()
            .Where(
                entry =>
                    entry.Person.UserId == userId ||
                    connectedUsers.Contains(entry.Person.UserId))
            .Where(
                entry =>
                    entry.From >= startTimeUtc &&
                    entry.Until <= endTimeUtc)
            .SumAsync(entry => entry.WorkDurationTicks, cancellationToken);
}
