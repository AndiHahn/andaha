using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Statistics.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Andaha.Services.Work.Requests.Statistics.GetAvailableTimeRange.V1;

internal class GetAvailableTimeRangeRequestHandler : IRequestHandler<GetAvailableTimeRangeRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetAvailableTimeRangeRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetAvailableTimeRangeRequest request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var result = await dbContext.WorkingEntry
            .AsNoTracking()
            .Select(workingEntry => new
            {
                StartDate = dbContext.WorkingEntry
                    .Where(GetUserFilterExpression(userId, connectedUsers))
                    .Min(entry => entry.From),
                EndDate = dbContext.WorkingEntry
                    .Where(GetUserFilterExpression(userId, connectedUsers))
                    .Max(entry => entry.Until)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return Results.Ok(new TimeRangeDto());
        }

        return Results.Ok(new TimeRangeDto(result.StartDate, result.EndDate));
    }

    private static Expression<Func<Core.WorkingEntry, bool>> GetUserFilterExpression(
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers)
        => (entry) => entry.Person.UserId == userId || connectedUsers.Contains(entry.Person.UserId);
}
