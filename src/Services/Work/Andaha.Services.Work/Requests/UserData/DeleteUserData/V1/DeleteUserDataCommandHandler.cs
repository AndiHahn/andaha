using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.UserData.DeleteUserData.V1;

/// <summary>
/// Deletes all work data of the current user: the persons created by the user with their working entries and payments.
/// Persons of connected users stay untouched. Idempotent: without data it simply returns 204.
/// </summary>
internal class DeleteUserDataCommandHandler : IRequestHandler<DeleteUserDataCommand, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;

    public DeleteUserDataCommandHandler(
        WorkDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(DeleteUserDataCommand request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var strategy = this.dbContext.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await this.dbContext.Database.BeginTransactionAsync(cancellationToken);

            // Person -> WorkingEntry/Payment is Restrict, so the dependents go first.
            await this.dbContext.WorkingEntry
                .Where(entry => entry.Person.UserId == userId)
                .ExecuteDeleteAsync(cancellationToken);
            await this.dbContext.Payment
                .Where(payment => payment.Person.UserId == userId)
                .ExecuteDeleteAsync(cancellationToken);
            await this.dbContext.Person
                .Where(person => person.UserId == userId)
                .ExecuteDeleteAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
        });

        return Results.NoContent();
    }
}
