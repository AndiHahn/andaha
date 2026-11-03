using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Person.Dtos.V1;
using Andaha.Services.Work.Requests.Person.ListPersons.V1;
using Andaha.Services.Work.Requests.Person.UpdatePerson.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using NSubstitute;

namespace Andaha.Services.Work.Tests.Person;

public sealed class PersonDtoTests : IDisposable
{
    private const string Notes = "Schlüssel unter der Matte";

    private readonly Guid userId = Guid.NewGuid();
    private readonly WorkDbContext context;
    private readonly SqliteConnection connection;
    private readonly IIdentityService identityService = Substitute.For<IIdentityService>();
    private readonly ICollaborationApiProxy collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();
    private readonly Core.Person person;

    public PersonDtoTests()
    {
        (this.context, this.connection) = TestDb.CreateWork();
        this.identityService.GetUserId().Returns(this.userId);
        this.collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>())
            .Returns(Array.Empty<Guid>());

        this.person = new Core.Person(this.userId, "Maria", 15, Notes);
        var start = new DateTime(2026, 1, 5, 8, 0, 0, DateTimeKind.Utc);
        this.person.AddWorkingEntry(start, start.AddHours(2), TimeSpan.Zero, null);
        this.person.AddWorkingEntry(start.AddDays(1), start.AddDays(1).AddHours(3), TimeSpan.Zero, null);
        this.person.AddPayment(TimeSpan.FromHours(2), 50, 5, null);
        this.person.AddPayment(TimeSpan.FromHours(3), 60, 0, "Rest");
        this.context.Person.Add(this.person);
        this.context.SaveChanges();

        // Older payment (2 h) gets an earlier date than the newer one (3 h).
        var older = this.person.Payments.Single(p => p.PayedMoney == 50);
        var newer = this.person.Payments.Single(p => p.PayedMoney == 60);
        this.context.Entry(older).Property(nameof(Core.Payment.PayedAt)).CurrentValue =
            new DateTime(2026, 1, 6, 12, 0, 0, DateTimeKind.Utc);
        this.context.Entry(newer).Property(nameof(Core.Payment.PayedAt)).CurrentValue =
            new DateTime(2026, 1, 8, 12, 0, 0, DateTimeKind.Utc);
        this.context.SaveChanges();
        this.context.ChangeTracker.Clear();
    }

    public void Dispose()
    {
        this.context.Dispose();
        this.connection.Dispose();
    }

    private async Task<PersonDto> ListSingle()
    {
        var handler = new ListPersonsRequestHandler(this.context, this.identityService, this.collaborationApiProxy);
        var result = await handler.Handle(new ListPersonsRequest(), CancellationToken.None);
        var ok = Assert.IsType<Ok<List<PersonDto>>>(result);
        return Assert.Single(ok.Value!);
    }

    [Fact]
    public async Task List_returns_real_notes()
    {
        var dto = await ListSingle();

        Assert.Equal(Notes, dto.Notes);
    }

    [Fact]
    public async Task List_returns_payments_newest_first()
    {
        var dto = await ListSingle();

        Assert.Equal(2, dto.Payments.Count);
        var payments = dto.Payments.ToList();
        Assert.Equal(60, payments[0].PayedMoney);
        Assert.Equal(0, payments[0].PayedTip);
        Assert.Equal(TimeSpan.FromHours(3), payments[0].PayedHours);
        Assert.Equal("Rest", payments[0].Notes);
        Assert.Equal(50, payments[1].PayedMoney);
        Assert.Equal(5, payments[1].PayedTip);
        Assert.True(payments[0].PayedAt > payments[1].PayedAt);
    }

    [Fact]
    public async Task Update_returns_hours_and_payments()
    {
        var handler = new UpdatePersonRequestHandler(this.context, this.identityService, this.collaborationApiProxy);

        var result = await handler.Handle(
            new UpdatePersonRequest(this.person.Id, new UpdatePersonDto("Maria Neu", 15, null)),
            CancellationToken.None);

        var ok = Assert.IsType<Ok<PersonDto>>(result);
        var dto = ok.Value!;
        Assert.Equal("Maria Neu", dto.Name);
        Assert.Equal(Notes, dto.Notes);
        Assert.Equal(TimeSpan.FromHours(5), dto.TotalHours);
        Assert.Equal(TimeSpan.FromHours(5), dto.PayedHours);
        Assert.Equal(2, dto.Payments.Count);
    }
}
