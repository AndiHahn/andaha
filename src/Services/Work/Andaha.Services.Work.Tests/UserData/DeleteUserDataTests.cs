using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Requests.UserData.DeleteUserData.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Work.Tests.UserData;

public sealed class DeleteUserDataTests : IDisposable
{
    private readonly Guid userId = Guid.NewGuid();
    private readonly Guid otherUserId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly IIdentityService identityService = Substitute.For<IIdentityService>();
    private readonly Guid otherPersonId;

    public DeleteUserDataTests()
    {
        WorkDbContext seedContext;
        (seedContext, this.connection) = TestDb.CreateWork();
        this.identityService.GetUserId().Returns(this.userId);

        using (seedContext)
        {
            var start = new DateTime(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc);

            var maria = new Core.Person(this.userId, "Maria", 15, null);
            maria.AddWorkingEntry(start, start.AddHours(2), TimeSpan.Zero, null);
            maria.AddWorkingEntry(start.AddDays(1), start.AddDays(1).AddHours(3), TimeSpan.Zero, null);
            maria.AddPayment(TimeSpan.FromHours(2), 30, 0, null);

            var josef = new Core.Person(this.userId, "Josef", 20, null);
            josef.AddWorkingEntry(start, start.AddHours(1), TimeSpan.Zero, null);

            var other = new Core.Person(this.otherUserId, "Partner", 25, null);
            other.AddWorkingEntry(start, start.AddHours(4), TimeSpan.Zero, null);
            other.AddPayment(TimeSpan.FromHours(4), 100, 10, null);

            seedContext.Person.AddRange(maria, josef, other);
            seedContext.SaveChanges();

            this.otherPersonId = other.Id;
        }
    }

    public void Dispose() => this.connection.Dispose();

    private async Task<IResult> DeleteUserData()
    {
        using var context = TestDb.Open(this.connection);
        var handler = new DeleteUserDataCommandHandler(context, this.identityService);
        return await handler.Handle(new DeleteUserDataCommand(), CancellationToken.None);
    }

    [Fact]
    public async Task DeleteUserData_removes_own_persons_entries_payments_and_keeps_others()
    {
        var result = await this.DeleteUserData();

        Assert.IsType<NoContent>(result);

        using var context = TestDb.Open(this.connection);
        var person = Assert.Single(await context.Person.ToListAsync());
        Assert.Equal(this.otherPersonId, person.Id);
        Assert.All(await context.WorkingEntry.ToListAsync(), entry => Assert.Equal(this.otherPersonId, entry.PersonId));
        Assert.Single(await context.WorkingEntry.ToListAsync());
        var payment = Assert.Single(await context.Payment.ToListAsync());
        Assert.Equal(this.otherPersonId, payment.PersonId);
    }

    [Fact]
    public async Task DeleteUserData_twice_returns_no_content()
    {
        Assert.IsType<NoContent>(await this.DeleteUserData());
        Assert.IsType<NoContent>(await this.DeleteUserData());

        using var context = TestDb.Open(this.connection);
        Assert.Equal(1, await context.Person.CountAsync());
    }
}
