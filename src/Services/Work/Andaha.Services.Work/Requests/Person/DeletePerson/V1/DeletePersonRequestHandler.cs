using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Person.DeletePerson.V1;

public class DeletePersonRequestHandler : IRequestHandler<DeletePersonRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public DeletePersonRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(DeletePersonRequest request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var person = await dbContext.Person
            .Include(person => person.WorkingEntries)
            .FirstOrDefaultAsync(person => person.Id == request.Id, cancellationToken);
        if (person is null)
        {
            return Results.NotFound($"Person with id {request.Id} not found.");
        }

        if (person.UserId != userId && !connectedUsers.Contains(userId))
        {
            return Results.Forbid();
        }

        dbContext.Person.Remove(person);
                
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
