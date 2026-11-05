using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Person.DeletePayment.V1;
using Andaha.Services.Work.Requests.Person.Dtos.V1;
using Andaha.Services.Work.Requests.Person.ListPersons.V1;
using Andaha.Services.Work.Requests.Person.UpdatePayment.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Work.Tests.Person;

public sealed class PaymentTests : IDisposable
{
    private readonly Guid userId = Guid.NewGuid();
    private readonly Guid otherUserId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly IIdentityService identityService = Substitute.For<IIdentityService>();
    private readonly ICollaborationApiProxy collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();
    private readonly Guid personId;
    private readonly Guid paymentId;
    private readonly Guid foreignPersonId;
    private readonly Guid foreignPaymentId;

    public PaymentTests()
    {
        WorkDbContext seedContext;
        (seedContext, this.connection) = TestDb.CreateWork();
        this.identityService.GetUserId().Returns(this.userId);
        this.collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>())
            .Returns(Array.Empty<Guid>());

        using (seedContext)
        {
            var person = new Core.Person(this.userId, "Maria", 20, null);
            var start = new DateTime(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc);
            person.AddWorkingEntry(start, start.AddHours(5), TimeSpan.Zero, null);
            person.AddPayment(TimeSpan.FromHours(2), 40, 5, "alt");

            var foreignPerson = new Core.Person(this.otherUserId, "Fremd", 30, null);
            foreignPerson.AddPayment(TimeSpan.FromHours(1), 30, 0, null);

            seedContext.Person.AddRange(person, foreignPerson);
            seedContext.SaveChanges();

            this.personId = person.Id;
            this.paymentId = person.Payments.Single().Id;
            this.foreignPersonId = foreignPerson.Id;
            this.foreignPaymentId = foreignPerson.Payments.Single().Id;
        }
    }

    public void Dispose() => this.connection.Dispose();

    private WorkDbContext NewContext() => TestDb.Open(this.connection);

    private async Task<IResult> Update(Guid personId, Guid paymentId, UpdatePaymentDto payment)
    {
        using var context = this.NewContext();
        var handler = new UpdatePaymentCommandHandler(context, this.identityService, this.collaborationApiProxy);
        return await handler.Handle(new UpdatePaymentCommand(personId, paymentId, payment), CancellationToken.None);
    }

    private async Task<IResult> Delete(Guid personId, Guid paymentId)
    {
        using var context = this.NewContext();
        var handler = new DeletePaymentCommandHandler(context, this.identityService, this.collaborationApiProxy);
        return await handler.Handle(new DeletePaymentCommand(personId, paymentId), CancellationToken.None);
    }

    private async Task<PersonDto> LoadOwnPerson()
    {
        using var context = this.NewContext();
        var handler = new ListPersonsRequestHandler(context, this.identityService, this.collaborationApiProxy);
        var result = await handler.Handle(new ListPersonsRequest(), CancellationToken.None);
        var ok = Assert.IsType<Ok<List<PersonDto>>>(result);
        return Assert.Single(ok.Value!);
    }

    [Fact]
    public async Task UpdatePayment_changes_values_and_person_totals()
    {
        var before = Assert.Single((await this.LoadOwnPerson()).Payments);

        var result = await this.Update(
            this.personId,
            this.paymentId,
            new UpdatePaymentDto(TimeSpan.FromHours(3.5), 70, 10, "neu"));

        Assert.IsType<NoContent>(result);

        var person = await this.LoadOwnPerson();
        Assert.Equal(TimeSpan.FromHours(3.5), person.PayedHours);
        var payment = Assert.Single(person.Payments);
        Assert.Equal(this.paymentId, payment.Id);
        Assert.Equal(TimeSpan.FromHours(3.5), payment.PayedHours);
        Assert.Equal(70, payment.PayedMoney);
        Assert.Equal(10, payment.PayedTip);
        Assert.Equal("neu", payment.Notes);
        Assert.Equal(before.PayedAt, payment.PayedAt);
    }

    [Fact]
    public async Task DeletePayment_removes_it()
    {
        var result = await this.Delete(this.personId, this.paymentId);

        Assert.IsType<NoContent>(result);

        var person = await this.LoadOwnPerson();
        Assert.Empty(person.Payments);
        Assert.Equal(TimeSpan.Zero, person.PayedHours);
        Assert.Equal(TimeSpan.FromHours(5), person.TotalHours);

        using var context = this.NewContext();
        Assert.Equal(1, await context.Payment.CountAsync());
    }

    [Fact]
    public async Task Payment_endpoints_404_for_foreign_person()
    {
        var payment = new UpdatePaymentDto(TimeSpan.FromHours(9), 999, 9, "gehackt");

        // Foreign person and its payment.
        Assert.IsType<NotFound<string>>(await this.Update(this.foreignPersonId, this.foreignPaymentId, payment));
        Assert.IsType<NotFound<string>>(await this.Delete(this.foreignPersonId, this.foreignPaymentId));

        // Foreign payment addressed through the own person.
        Assert.IsType<NotFound<string>>(await this.Update(this.personId, this.foreignPaymentId, payment));
        Assert.IsType<NotFound<string>>(await this.Delete(this.personId, this.foreignPaymentId));

        // Unknown person and unknown payment.
        Assert.IsType<NotFound<string>>(await this.Update(Guid.NewGuid(), this.paymentId, payment));
        Assert.IsType<NotFound<string>>(await this.Delete(this.personId, Guid.NewGuid()));

        using var context = this.NewContext();
        var foreignPayment = await context.Payment.SingleAsync(p => p.Id == this.foreignPaymentId);
        Assert.Equal(30, foreignPayment.PayedMoney);
        Assert.Equal(2, await context.Payment.CountAsync());
    }
}
