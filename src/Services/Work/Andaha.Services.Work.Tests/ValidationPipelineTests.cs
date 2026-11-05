using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Person.CreatePerson.V1;
using Andaha.Services.Work.Requests.Person.Dtos.V1;
using Andaha.Services.Work.Requests.Person.UpdatePayment.V1;
using Andaha.Services.Work.Requests.WorkingEntry.CreateWorkingEntry.V1;
using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using Andaha.Services.Work.Requests.WorkingEntry.ListWorkingEntryMonths.V1;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace Andaha.Services.Work.Tests;

/// <summary>
/// Sends Work requests through the real MediatR pipeline of the service (the same registration the standalone host and
/// the Monolith use), so the request validators run as in production. Only the database, the signed-in user and the
/// collaboration proxy are replaced.
/// </summary>
public sealed class ValidationPipelineTests : IDisposable
{
    private static readonly DateTime From = new(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc);

    private readonly Guid userId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly Guid personId;
    private readonly Guid paymentId;

    public ValidationPipelineTests()
    {
        Infrastructure.WorkDbContext seedContext;
        (seedContext, this.connection) = TestDb.CreateWork();

        using (seedContext)
        {
            var person = new Core.Person(this.userId, "ZZ Maria", 20, null);
            person.AddPayment(TimeSpan.FromHours(2), 40, 5, "alt");

            seedContext.Person.Add(person);
            seedContext.SaveChanges();

            this.personId = person.Id;
            this.paymentId = person.Payments.Single().Id;
        }
    }

    public void Dispose() => this.connection.Dispose();

    private WebApplication BuildApp()
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(this.userId);

        var collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();
        collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>()).Returns(Array.Empty<Guid>());

        var builder = WebApplication.CreateBuilder();
        builder.AddCustomApplicationServices();

        // Test doubles for the database, the signed-in user and the collaboration service; the last registration wins.
        builder.Services.AddScoped(_ => TestDb.Open(this.connection));
        builder.Services.AddSingleton(identity);
        builder.Services.AddSingleton(collaborationApiProxy);

        return builder.Build();
    }

    private async Task<IResult> SendAsync(IRequest<IResult> request)
    {
        await using var app = this.BuildApp();
        using var scope = app.Services.CreateScope();

        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        return await mediator.Send(request);
    }

    private static HttpValidationProblemDetails AssertValidationProblem(IResult result)
    {
        var problem = Assert.IsType<ValidationProblem>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.StatusCode);

        return problem.ProblemDetails;
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateWorkingEntry_with_until_not_after_from_returns_400_on_until_and_saves_nothing(int hours)
    {
        var request = new CreateWorkingEntryRequest(
            new CreateWorkingEntryDto(this.personId, From, From.AddHours(hours), TimeSpan.Zero, null));

        var result = await this.SendAsync(request);

        var problem = AssertValidationProblem(result);
        var untilErrors = Assert.Single(problem.Errors, error => error.Key == "Until").Value;

        // One message: the validator ran once (no second validation behavior in the pipeline).
        Assert.Single(untilErrors);

        using var context = TestDb.Open(this.connection);
        Assert.Empty(context.WorkingEntry.AsNoTracking());
    }

    [Fact]
    public async Task CreateWorkingEntry_valid_returns_204_and_saves_the_entry()
    {
        var request = new CreateWorkingEntryRequest(
            new CreateWorkingEntryDto(this.personId, From, From.AddHours(5), TimeSpan.FromMinutes(30), "ZZ"));

        var result = await this.SendAsync(request);

        Assert.IsType<NoContent>(result);

        using var context = TestDb.Open(this.connection);
        Assert.Single(context.WorkingEntry.AsNoTracking());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    public async Task UpdatePayment_with_invalid_amount_returns_400_and_keeps_the_payment(double payedMoney)
    {
        var request = new UpdatePaymentCommand(
            this.personId,
            this.paymentId,
            new UpdatePaymentDto(TimeSpan.FromHours(3), payedMoney, 0, "neu"));

        var result = await this.SendAsync(request);

        var problem = AssertValidationProblem(result);
        Assert.Contains("Payment.PayedMoney", problem.Errors.Keys);

        using var context = TestDb.Open(this.connection);
        var payment = await context.Payment.AsNoTracking().SingleAsync();
        Assert.Equal(40, payment.PayedMoney);
        Assert.Equal("alt", payment.Notes);
    }

    [Fact]
    public async Task CreatePerson_without_name_returns_400_and_saves_nothing()
    {
        // The person validators used to be internal and were therefore not registered by AddCqrs.
        var request = new CreatePersonRequest(new CreatePersonDto("", 20, null));

        var result = await this.SendAsync(request);

        var problem = AssertValidationProblem(result);
        Assert.Contains("Person.Name", problem.Errors.Keys);

        using var context = TestDb.Open(this.connection);
        Assert.Single(context.Person.AsNoTracking());
    }

    [Fact]
    public async Task ListWorkingEntryMonths_with_unknown_time_zone_returns_400_on_tz()
    {
        var query = new ListWorkingEntryMonthsQuery(this.personId, "2026-03", 3, "Mars/Olympus_Mons");

        var result = await this.SendAsync(query);

        var problem = AssertValidationProblem(result);
        Assert.Contains("Tz", problem.Errors.Keys);
    }
}
