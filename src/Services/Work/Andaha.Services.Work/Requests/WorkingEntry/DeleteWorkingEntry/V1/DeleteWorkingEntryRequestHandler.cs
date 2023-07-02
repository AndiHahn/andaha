using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.WorkingEntry.DeleteWorkingEntry.V1;

internal class DeleteWorkingEntryRequestHandler : IRequestHandler<DeleteWorkingEntryRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public DeleteWorkingEntryRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(DeleteWorkingEntryRequest request, CancellationToken cancellationToken)
    {
        var userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var workingEntry = await dbContext.WorkingEntry
            .Include(entry => entry.Person)
            .FirstOrDefaultAsync(entry => entry.Id == request.Id, cancellationToken);
        if (workingEntry is null)
        {
            return Results.NotFound($"Working entry with id '{request.Id}' not found.");
        }

        if (!workingEntry.Person.HasCreated(userId) && !connectedUsers.Contains(workingEntry.Person.UserId))
        {
            return Results.Forbid();
        }

        dbContext.WorkingEntry.Remove(workingEntry);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
