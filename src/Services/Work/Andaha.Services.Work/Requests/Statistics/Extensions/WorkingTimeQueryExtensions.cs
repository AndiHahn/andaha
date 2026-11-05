using Andaha.Services.Work.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Statistics.Extensions;

internal static class WorkingTimeQueryExtensions
{
    /// <summary>
    /// Persons of the user and of connected users. A non-empty <paramref name="personFilter"/> narrows this set;
    /// ids outside of it match nothing. An empty or missing filter means all of these persons.
    /// </summary>
    public static IQueryable<Core.Person> VisiblePersons(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        IReadOnlyCollection<Guid>? personFilter)
    {
        var persons = dbContext.Person
            .AsNoTracking()
            .Where(person => person.UserId == userId || connectedUsers.Contains(person.UserId));

        return personFilter is { Count: > 0 }
            ? persons.Where(person => personFilter.Contains(person.Id))
            : persons;
    }

    /// <summary>
    /// Working entries of the persons returned by <see cref="VisiblePersons"/>.
    /// </summary>
    public static IQueryable<Core.WorkingEntry> VisibleWorkingEntries(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        IReadOnlyCollection<Guid>? personFilter)
    {
        var entries = dbContext.WorkingEntry
            .AsNoTracking()
            .Where(entry => entry.Person.UserId == userId || connectedUsers.Contains(entry.Person.UserId));

        return personFilter is { Count: > 0 }
            ? entries.Where(entry => personFilter.Contains(entry.PersonId))
            : entries;
    }

    public static async Task<double> GetExtrapolatedPayedMoneyAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        IReadOnlyCollection<Guid>? personFilter,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.VisibleWorkingEntries(userId, connectedUsers, personFilter)
            .Where(
                entry => entry.Person.HourlyRate > 0 &&
                entry.From >= startTimeUtc &&
                entry.Until <= endTimeUtc)
            .Select(entry => new
            {
                HourlyRate = entry.Person.HourlyRate,
                WorkDuration = new TimeSpan(entry.WorkDurationTicks)
            })
            .ToListAsync(cancellationToken);

        return Math.Round(result.Select(entry => entry.WorkDuration.TotalHours * entry.HourlyRate).Sum(), 2);
    }

    public static async Task<double> GetTotalMoneyToPayAsync(this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        IReadOnlyCollection<Guid>? personFilter,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.VisibleWorkingEntries(userId, connectedUsers, personFilter)
            .Where(entry => entry.Person.HourlyRate > 0)
            .Select(entry => new
            {
                HourlyRate = entry.Person.HourlyRate,
                WorkDuration = new TimeSpan(entry.WorkDurationTicks)
            })
            .ToListAsync(cancellationToken);

        return Math.Round(result.Select(entry => entry.WorkDuration.TotalHours * entry.HourlyRate).Sum(), 2);
    }

    public static Task<double> GetTotalPayedTipAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        IReadOnlyCollection<Guid>? personFilter,
        CancellationToken cancellationToken)
        => dbContext.VisiblePersons(userId, connectedUsers, personFilter)
            .SelectMany(person => person.Payments)
            .SumAsync(payment => payment.PayedTip, cancellationToken);

    public static Task<double> GetTotalPayedMoneyAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        IReadOnlyCollection<Guid>? personFilter,
        CancellationToken cancellationToken)
        => dbContext.VisiblePersons(userId, connectedUsers, personFilter)
            .SelectMany(person => person.Payments)
            .SumAsync(payment => payment.PayedMoney, cancellationToken);

    public static Task<long> GetWorkingTimeAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        IReadOnlyCollection<Guid>? personFilter,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        CancellationToken cancellationToken)
        => dbContext.VisibleWorkingEntries(userId, connectedUsers, personFilter)
            .Where(
                entry =>
                    entry.From >= startTimeUtc &&
                    entry.Until <= endTimeUtc)
            .SumAsync(entry => entry.WorkDurationTicks, cancellationToken);

    public static Task<long> GetTotalWorkingTimeAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        IReadOnlyCollection<Guid>? personFilter,
        CancellationToken cancellationToken)
        => dbContext.VisibleWorkingEntries(userId, connectedUsers, personFilter)
            .SumAsync(entry => entry.WorkDurationTicks, cancellationToken);
}
