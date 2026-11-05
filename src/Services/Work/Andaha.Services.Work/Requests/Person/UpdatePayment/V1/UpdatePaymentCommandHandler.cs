using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Person.UpdatePayment.V1;

internal class UpdatePaymentCommandHandler : IRequestHandler<UpdatePaymentCommand, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public UpdatePaymentCommandHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(UpdatePaymentCommand request, CancellationToken cancellationToken)
    {
        var userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        // Persons of other, not connected users behave as if they did not exist.
        var person = await this.dbContext.Person
            .Include(person => person.Payments)
            .FirstOrDefaultAsync(
                person => person.Id == request.PersonId &&
                          (person.UserId == userId || connectedUsers.Contains(person.UserId)),
                cancellationToken);
        if (person is null)
        {
            return Results.NotFound($"Person with id '{request.PersonId}' not found.");
        }

        bool updated = person.UpdatePayment(
            request.PaymentId,
            request.Payment.PayedHours,
            request.Payment.PayedMoney,
            request.Payment.PayedTip,
            request.Payment.Notes);
        if (!updated)
        {
            return Results.NotFound($"Payment with id '{request.PaymentId}' not found.");
        }

        await this.dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
