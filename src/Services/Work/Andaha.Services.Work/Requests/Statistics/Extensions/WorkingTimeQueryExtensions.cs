using Andaha.Services.Work.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Statistics.Extensions;

internal static class WorkingTimeQueryExtensions
{
    public static async Task<double> GetExtrapolatedPayedMoneyAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.WorkingEntry
            .AsNoTracking()
            .Where(
                entry => (entry.Person.UserId == userId ||
                connectedUsers.Contains(entry.Person.UserId)) &&
                entry.Person.HourlyRate > 0 &&
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
        CancellationToken cancellationToken)
    {
        var result = await dbContext.WorkingEntry
            .AsNoTracking()
            .Where(
                entry => (entry.Person.UserId == userId ||
                connectedUsers.Contains(entry.Person.UserId)) &&
                entry.Person.HourlyRate > 0)
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
        CancellationToken cancellationToken)
        => dbContext.Person
            .AsNoTracking()
            .Where(
                person =>
                    person.UserId == userId ||
                    connectedUsers.Contains(person.UserId))
            .SelectMany(person => person.Payments)
            .SumAsync(payment => payment.PayedTip, cancellationToken);

    public static Task<double> GetTotalPayedMoneyAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        CancellationToken cancellationToken)
        => dbContext.Person
            .AsNoTracking()
            .Where(
                person =>
                    person.UserId == userId ||
                    connectedUsers.Contains(person.UserId))
            .SelectMany(person => person.Payments)
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

    public static Task<long> GetTotalWorkingTimeAsync(
        this WorkDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        CancellationToken cancellationToken)
        => dbContext.WorkingEntry
            .AsNoTracking()
            .Where(
                entry =>
                    entry.Person.UserId == userId ||
                    connectedUsers.Contains(entry.Person.UserId))
            .SumAsync(entry => entry.WorkDurationTicks, cancellationToken);
}
