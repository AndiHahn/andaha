using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Statistics.Dtos.V1;
using Andaha.Services.Work.Requests.Statistics.Extensions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Statistics.GetStatistics.V1;

internal class GetStatisticsRequestHandler : IRequestHandler<GetStatisticsRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetStatisticsRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetStatisticsRequest request, CancellationToken cancellationToken)
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

        var totalWorkingTime = new TimeSpan(totalWorkingTimeUnix);

        var result = new StatisticsDto(
            TotalWorkingTime: totalWorkingTime,
            PayedMoney: payedMoney);

        return Results.Ok(result);
    }
}
