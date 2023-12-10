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

        long totalWorkingTimeUnix = await this.dbContext.GetTotalWorkingTimeAsync(
            userId,
            connectedUsers,
            cancellationToken);

        double payedMoney = await this.dbContext.GetTotalPayedMoneyAsync(
            userId,
            connectedUsers,
            cancellationToken);

        double totalMoneyToPay = await this.dbContext.GetTotalMoneyToPayAsync(
            userId,
            connectedUsers,
            cancellationToken);

        double totalPayedTip = await this.dbContext.GetTotalPayedTipAsync(
            userId,
            connectedUsers,
            cancellationToken);

        long totalHoursToPayUnix = await GetHoursToPayAsync(userId, connectedUsers, cancellationToken);
        long hoursPayedUnix = await GetHoursPayedAsync(userId, connectedUsers, cancellationToken);

        var totalWorkingTime = new TimeSpan(totalWorkingTimeUnix);
        var totalHoursToPay = new TimeSpan(totalHoursToPayUnix);
        var hoursPayed = new TimeSpan(hoursPayedUnix);

        var result = new FullStatisticsDto(
            TotalWorkingTime: totalWorkingTime,
            PayedMoney: Math.Round(payedMoney, 2),
            NotPayedHours: totalHoursToPay - hoursPayed,
            NotPayedMoney: Math.Round(totalMoneyToPay - payedMoney + totalPayedTip, 2));

        return Results.Ok(result);
    }

    private Task<long> GetHoursPayedAsync(
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
            .SelectMany(person => person.Payments)
            .SumAsync(payment => payment.PayedHoursTicks, cancellationToken);

    private Task<long> GetHoursToPayAsync(
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
            .SelectMany(person => person.WorkingEntries)
            .SumAsync(entry => entry.WorkDurationTicks, cancellationToken);
}
