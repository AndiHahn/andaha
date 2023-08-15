using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.WorkingEntry.UpdateWorkingEntry.V1;

public class UpdateWorkingEntryRequestHandler : IRequestHandler<UpdateWorkingEntryRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public UpdateWorkingEntryRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }
    public async Task<IResult> Handle(UpdateWorkingEntryRequest request, CancellationToken cancellationToken)
    {
        var userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var entry = await this.dbContext.WorkingEntry
            .Include(entry => entry.Person)
            .FirstOrDefaultAsync(entry => entry.Id == request.Id, cancellationToken);

        if (entry is null)
        {
            return Results.NotFound($"Entry with id '{request.Id}' not found.");
        }

        if (!entry.Person.HasCreated(userId) && !connectedUsers.Contains(entry.Person.UserId))
        {
            return Results.Forbid();
        }

        entry.Update(
            request.WorkingEntry.From,
            request.WorkingEntry.Until,
            request.WorkingEntry.Break,
            request.WorkingEntry.Notes);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
