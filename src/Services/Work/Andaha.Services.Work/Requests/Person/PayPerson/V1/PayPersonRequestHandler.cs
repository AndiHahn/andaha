using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using MediatR;

namespace Andaha.Services.Work.Requests.Person.PayPerson.V1;

internal class PayPersonRequestHandler : IRequestHandler<PayPersonRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public PayPersonRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(PayPersonRequest request, CancellationToken cancellationToken)
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

        person.AddPayment(
            request.PayPerson.PayedHours,
            request.PayPerson.PayedMoney,
            request.PayPerson.PayedTip,
            request.PayPerson.Notes);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
