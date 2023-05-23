using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using MediatR;

namespace Andaha.Services.Work.Requests.WorkingEntry.CreateWorkingEntry.V1;

public class CreateWorkingEntryRequestHandler : IRequestHandler<CreateWorkingEntryRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public CreateWorkingEntryRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(CreateWorkingEntryRequest request, CancellationToken cancellationToken)
    {
        var userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var person = await dbContext.Person.FindByIdAsync(request.WorkingEntry.PersonId, cancellationToken);
        if (person is null)
        {
            return Results.NotFound($"Person with id '{request.WorkingEntry.PersonId}' not found.");
        }

        if (!person.HasCreated(userId) && !connectedUsers.Contains(person.UserId))
        {
            return Results.Forbid();
        }

        person.AddWorkingEntry(
            request.WorkingEntry.From,
            request.WorkingEntry.Until,
            request.WorkingEntry.Break,
            request.WorkingEntry.Notes);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
