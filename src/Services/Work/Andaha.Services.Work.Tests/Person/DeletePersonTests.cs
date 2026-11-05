using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Person.DeletePerson.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Work.Tests.Person;

public sealed class DeletePersonTests : IDisposable
{
    private readonly Guid userId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly IIdentityService identityService = Substitute.For<IIdentityService>();
    private readonly ICollaborationApiProxy collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();
    private readonly Guid mariaId;
    private readonly Guid josefId;
    private readonly Guid foreignId;

    public DeletePersonTests()
    {
        WorkDbContext seedContext;
        (seedContext, this.connection) = TestDb.CreateWork();
        this.identityService.GetUserId().Returns(this.userId);
        this.collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>())
            .Returns(Array.Empty<Guid>());

        using (seedContext)
        {
            var start = new DateTime(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc);

            var maria = new Core.Person(this.userId, "Maria", 15, null);
            maria.AddWorkingEntry(start, start.AddHours(2), TimeSpan.Zero, null);
            maria.AddWorkingEntry(start.AddDays(1), start.AddDays(1).AddHours(3), TimeSpan.Zero, null);
            maria.AddPayment(TimeSpan.FromHours(2), 30, 0, null);
            maria.AddPayment(TimeSpan.FromHours(1), 15, 2, null);

            var josef = new Core.Person(this.userId, "Josef", 20, null);
            josef.AddWorkingEntry(start, start.AddHours(1), TimeSpan.Zero, null);
            josef.AddPayment(TimeSpan.FromHours(1), 20, 0, null);

            var foreign = new Core.Person(Guid.NewGuid(), "Fremd", 25, null);
            foreign.AddWorkingEntry(start, start.AddHours(4), TimeSpan.Zero, null);
            foreign.AddPayment(TimeSpan.FromHours(4), 100, 10, null);

            seedContext.Person.AddRange(maria, josef, foreign);
            seedContext.SaveChanges();

            (this.mariaId, this.josefId, this.foreignId) = (maria.Id, josef.Id, foreign.Id);
        }
    }

    public void Dispose() => this.connection.Dispose();

    private async Task<IResult> Delete(Guid personId)
    {
        using var context = TestDb.Open(this.connection);
        var handler = new DeletePersonRequestHandler(context, this.identityService, this.collaborationApiProxy);
        return await handler.Handle(new DeletePersonRequest(personId), CancellationToken.None);
    }

    [Fact]
    public async Task Delete_person_with_entries_and_payments_removes_all()
    {
        var result = await this.Delete(this.mariaId);

        Assert.IsType<NoContent>(result);

        using var context = TestDb.Open(this.connection);
        Assert.False(await context.Person.AnyAsync(person => person.Id == this.mariaId));
        Assert.False(await context.WorkingEntry.AnyAsync(entry => entry.PersonId == this.mariaId));
        Assert.False(await context.Payment.AnyAsync(payment => payment.PersonId == this.mariaId));
    }

    [Fact]
    public async Task Delete_person_keeps_data_of_other_persons()
    {
        Assert.IsType<NoContent>(await this.Delete(this.mariaId));

        using var context = TestDb.Open(this.connection);
        Assert.Equal(
            new[] { this.josefId, this.foreignId }.Order(),
            (await context.Person.Select(person => person.Id).ToListAsync()).Order());
        Assert.Equal(1, await context.WorkingEntry.CountAsync(entry => entry.PersonId == this.josefId));
        Assert.Equal(1, await context.WorkingEntry.CountAsync(entry => entry.PersonId == this.foreignId));
        Assert.Equal(1, await context.Payment.CountAsync(payment => payment.PersonId == this.josefId));
        Assert.Equal(1, await context.Payment.CountAsync(payment => payment.PersonId == this.foreignId));
    }

    [Fact]
    public async Task Delete_person_keeps_ownership_and_not_found_behaviour()
    {
        Assert.IsType<NotFound<string>>(await this.Delete(Guid.NewGuid()));
        Assert.IsType<ForbidHttpResult>(await this.Delete(this.foreignId));

        using var context = TestDb.Open(this.connection);
        Assert.True(await context.Person.AnyAsync(person => person.Id == this.foreignId));
        Assert.Equal(1, await context.WorkingEntry.CountAsync(entry => entry.PersonId == this.foreignId));
        Assert.Equal(1, await context.Payment.CountAsync(payment => payment.PersonId == this.foreignId));
    }
}
