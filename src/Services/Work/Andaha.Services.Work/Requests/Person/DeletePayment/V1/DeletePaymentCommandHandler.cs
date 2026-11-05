using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Person.DeletePayment.V1;

internal class DeletePaymentCommandHandler : IRequestHandler<DeletePaymentCommand, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public DeletePaymentCommandHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(DeletePaymentCommand request, CancellationToken cancellationToken)
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

        var payment = person.RemovePayment(request.PaymentId);
        if (payment is null)
        {
            return Results.NotFound($"Payment with id '{request.PaymentId}' not found.");
        }

        // Person -> Payment does not cascade, so the removed payment is deleted explicitly.
        this.dbContext.Payment.Remove(payment);

        await this.dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
