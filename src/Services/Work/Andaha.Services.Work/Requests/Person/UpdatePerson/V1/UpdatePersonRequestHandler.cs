using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Person.Dtos.V1;
using LinqKit;
using MediatR;

namespace Andaha.Services.Work.Requests.Person.UpdatePerson.V1;

internal class UpdatePersonRequestHandler : IRequestHandler<UpdatePersonRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public UpdatePersonRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(UpdatePersonRequest request, CancellationToken cancellationToken)
    {
        var person = await this.dbContext.Person.FindByIdAsync(request.Id, cancellationToken);
        if (person is null)
        {
            return Results.NotFound($"Person with id '{request.Id}' not found.");
        }

        var userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        if (person.UserId != userId && !connectedUsers.Contains(person.UserId))
        {
            return Results.Forbid();
        }

        person.Update(request.UpdatePerson.Name, request.UpdatePerson.HourlyRate, notes: request.UpdatePerson.Notes);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(PersonDtoMapping.EntityToDto.Invoke(person, userId));
    }
}
