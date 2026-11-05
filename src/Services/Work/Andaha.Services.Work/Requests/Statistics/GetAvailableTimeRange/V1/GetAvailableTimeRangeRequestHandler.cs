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

        var entries = dbContext.WorkingEntry
            .AsNoTracking()
            .Where(GetUserFilterExpression(userId, connectedUsers));

        // Nullable projections: an account without entries has no Min/Max and gets the empty range,
        // also when its last entry is deleted between the two queries.
        DateTime? startDate = await entries.MinAsync(entry => (DateTime?)entry.From, cancellationToken);
        DateTime? endDate = startDate is null
            ? null
            : await entries.MaxAsync(entry => (DateTime?)entry.Until, cancellationToken);

        if (startDate is null || endDate is null)
        {
            return Results.Ok(new TimeRangeDto());
        }

        return Results.Ok(new TimeRangeDto(startDate.Value, endDate.Value));
    }

    private static Expression<Func<Core.WorkingEntry, bool>> GetUserFilterExpression(
        Guid userId,
        IReadOnlyCollection<Guid> connectedUsers)
        => (entry) => entry.Person.UserId == userId || connectedUsers.Contains(entry.Person.UserId);
}
