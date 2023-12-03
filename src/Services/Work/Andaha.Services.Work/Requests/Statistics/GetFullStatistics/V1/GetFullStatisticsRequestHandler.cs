using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Statistics.Dtos.V1;
using Andaha.Services.Work.Requests.Statistics.Extensions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Statistics.GetFullStatistics.V1;

internal class GetFullStatisticsRequestHandler : IRequestHandler<GetFullStatisticsRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetFullStatisticsRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetFullStatisticsRequest request, CancellationToken cancellationToken)
    {
        var userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        long totalWorkingTimeUnix = await this.dbContext.GetWorkingTimeAsync(
            userId,
            connectedUsers,
            request.Parameters.StartTimeUtc,
            request.Parameters.EndTimeUtc,
            cancellationToken);

        double payedMoney = await this.dbContext.GetPayedMoneyAsync(
            userId,
            connectedUsers,
            request.Parameters.StartTimeUtc,
            request.Parameters.EndTimeUtc,
            cancellationToken);

        long totalHoursToPayUnix = await GetHoursToPayAsync(request, userId, connectedUsers, cancellationToken);
        long hoursPayedUnix = await GetHoursPayedAsync(request, userId, connectedUsers, cancellationToken);

        var totalWorkingTime = new TimeSpan(totalWorkingTimeUnix);
        var totalHoursToPay = new TimeSpan(totalHoursToPayUnix);
        var hoursPayed = new TimeSpan(hoursPayedUnix);

        var result = new FullStatisticsDto(
            TotalWorkingTime: totalWorkingTime,
            PayedMoney: payedMoney,
            NotPayedHours: totalHoursToPay - hoursPayed,
            NotPayedMoney: 0);

        return Results.Ok(result);
    }

    private Task<long> GetHoursPayedAsync(
        GetFullStatisticsRequest request,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        CancellationToken cancellationToken)
        => this.dbContext.Person
            .AsNoTracking()
            .Where(
                person =>
                    person.UserId == userId ||
                    connectedUsers.Contains(person.UserId))
            .Where(person => person.HourlyRate > 0)
            .SelectMany(person => person.Payments
                .Where(
                    payment =>
                        payment.PayedAt >= request.Parameters.StartTimeUtc &&
                        payment.PayedAt <= request.Parameters.EndTimeUtc))
            .SumAsync(payment => payment.PayedHoursTicks, cancellationToken);

    private Task<long> GetHoursToPayAsync(
        GetFullStatisticsRequest request,
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers,
        CancellationToken cancellationToken)
        => this.dbContext.Person
            .AsNoTracking()
            .Where(
                person =>
                    person.UserId == userId ||
                    connectedUsers.Contains(person.UserId))
            .Where(person => person.HourlyRate > 0)
            .SelectMany(
                person => person.WorkingEntries
                    .Where(
                        entry =>
                            entry.From >= request.Parameters.StartTimeUtc &&
                            entry.Until <= request.Parameters.EndTimeUtc))
            .SumAsync(entry => entry.WorkDurationTicks, cancellationToken);
}
