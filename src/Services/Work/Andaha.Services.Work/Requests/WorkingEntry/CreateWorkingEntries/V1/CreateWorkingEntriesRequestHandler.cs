using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.WorkingEntry.CreateWorkingEntries.V1;

public class CreateWorkingEntriesRequestHandler : IRequestHandler<CreateWorkingEntriesRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public CreateWorkingEntriesRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(CreateWorkingEntriesRequest request, CancellationToken cancellationToken)
    {
        var userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var persons = await dbContext.Person
            .Where(person => request.WorkingEntries.PersonIds.Contains(person.Id))
            .ToListAsync(cancellationToken);

        foreach (var person in persons)
        {
            if (!person.HasCreated(userId) && !connectedUsers.Contains(person.UserId))
            {
                return Results.Forbid();
            }

            person.AddWorkingEntry(
                request.WorkingEntries.From,
                request.WorkingEntries.Until,
                request.WorkingEntries.Break,
                request.WorkingEntries.Notes);
        }
        
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
