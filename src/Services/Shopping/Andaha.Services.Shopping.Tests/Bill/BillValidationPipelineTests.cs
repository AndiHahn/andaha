using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.UpdateBill.V1;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

/// <summary>
/// Sends the bill commands through the real MediatR pipeline of the service (the same registration the standalone host
/// and the Monolith use), so the request validators run as in production. Only the database, the signed-in user and the
/// collaboration proxy are replaced.
/// </summary>
public sealed class BillValidationPipelineTests : IDisposable
{
    private readonly Guid userId = Guid.NewGuid();
    private readonly Guid strangerId = Guid.NewGuid();
    private readonly Guid partnerId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly Guid ownCategoryId;
    private readonly Guid strangerCategoryId;

    public BillValidationPipelineTests()
    {
        Infrastructure.ShoppingDbContext seedContext;
        (seedContext, this.connection) = TestDb.CreateShopping();

        using (seedContext)
        {
            var own = new BillCategory(this.userId, "Eigene", "#111111", 0, Array.Empty<(string, int)>());
            var strangers = new BillCategory(this.strangerId, "Fremde", "#222222", 0, Array.Empty<(string, int)>());
            seedContext.BillCategory.AddRange(own, strangers);
            seedContext.SaveChanges();

            this.ownCategoryId = own.Id;
            this.strangerCategoryId = strangers.Id;
        }
    }

    public void Dispose() => this.connection.Dispose();

    private WebApplication BuildApp()
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(this.userId);

        var collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();
        // The partner is connected to the signed-in user, the stranger is not.
        collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>()).Returns(new[] { this.partnerId });

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

    private static void AssertSingleValidationError(IResult result)
    {
        var problem = Assert.IsType<ValidationProblem>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.StatusCode);

        // Exactly one message: the validator ran once (no second validation behavior in the pipeline).
        Assert.Single(problem.ProblemDetails.Errors.SelectMany(error => error.Value));
    }

    [Fact]
    public async Task Create_with_category_of_unconnected_user_returns_400_and_saves_nothing()
    {
        var command = new CreateBillCommand(null, this.strangerCategoryId, null, "ZZ Shop", 12.5, DateTime.UtcNow, null, null);

        var result = await this.SendAsync(command);

        AssertSingleValidationError(result);

        using var context = TestDb.Open(this.connection);
        Assert.Empty(context.Bill.AsNoTracking());
    }

    [Fact]
    public async Task Create_with_own_category_returns_the_bill_and_saves_it()
    {
        var command = new CreateBillCommand(null, this.ownCategoryId, null, "ZZ Shop", 12.5, DateTime.UtcNow, null, null);

        var result = await this.SendAsync(command);

        var ok = Assert.IsType<Ok<BillDto>>(result);
        Assert.Equal("ZZ Shop", ok.Value!.ShopName);

        using var context = TestDb.Open(this.connection);
        var bill = Assert.Single(context.Bill.AsNoTracking());
        Assert.Equal(this.userId, bill.UserId);
        Assert.Equal(this.ownCategoryId, bill.CategoryId);
    }

    [Fact]
    public async Task Update_with_category_of_unconnected_user_returns_400_and_keeps_the_bill()
    {
        Guid billId;
        using (var seedContext = TestDb.Open(this.connection))
        {
            var bill = new Core.Bill(null, this.userId, this.ownCategoryId, null, "ZZ Shop", 12.5, DateTime.UtcNow);
            seedContext.Bill.Add(bill);
            seedContext.SaveChanges();
            billId = bill.Id;
        }

        var command = new UpdateBillCommand(billId, this.strangerCategoryId, null, "ZZ Anders", 99, DateTime.UtcNow, null, null);

        var result = await this.SendAsync(command);

        AssertSingleValidationError(result);

        using var context = TestDb.Open(this.connection);
        var unchanged = Assert.Single(context.Bill.AsNoTracking());
        Assert.Equal(this.ownCategoryId, unchanged.CategoryId);
        Assert.Equal("ZZ Shop", unchanged.ShopName);
        Assert.Equal(12.5, unchanged.Price);
    }

    private (Guid BillId, Guid CategoryId, Guid SubCategoryId, Guid OtherCategoryId) SeedPartnerBill()
    {
        using var seedContext = TestDb.Open(this.connection);

        var category = new BillCategory(this.partnerId, "Partner", "#333333", 0, new[] { ("Unter", 0) });
        var otherCategory = new BillCategory(this.partnerId, "Partner 2", "#444444", 1, Array.Empty<(string, int)>());
        seedContext.BillCategory.AddRange(category, otherCategory);
        seedContext.SaveChanges();

        var subCategoryId = category.SubCategories.Single().Id;
        var bill = new Core.Bill(null, this.partnerId, category.Id, subCategoryId, "ZZ Partner", 12.5, DateTime.UtcNow);
        seedContext.Bill.Add(bill);
        seedContext.SaveChanges();

        return (bill.Id, category.Id, subCategoryId, otherCategory.Id);
    }

    [Fact]
    public async Task Update_partner_bill_keeping_its_category_succeeds()
    {
        var (billId, categoryId, subCategoryId, _) = this.SeedPartnerBill();

        var command = new UpdateBillCommand(billId, categoryId, subCategoryId, "ZZ Partner", 20, DateTime.UtcNow, "neu", null);

        var result = await this.SendAsync(command);

        Assert.IsType<Ok<BillDto>>(result);

        using var context = TestDb.Open(this.connection);
        var bill = await context.Bill.AsNoTracking().SingleAsync(b => b.Id == billId);
        Assert.Equal(20, bill.Price);
        Assert.Equal("neu", bill.Notes);
        Assert.Equal(this.partnerId, bill.UserId);
        Assert.Equal(categoryId, bill.CategoryId);
        Assert.Equal(subCategoryId, bill.SubCategoryId);
    }

    [Fact]
    public async Task Update_partner_bill_to_partners_other_category_is_rejected()
    {
        var (billId, categoryId, subCategoryId, otherCategoryId) = this.SeedPartnerBill();

        var command = new UpdateBillCommand(billId, otherCategoryId, null, "ZZ Partner", 20, DateTime.UtcNow, null, null);

        var result = await this.SendAsync(command);

        AssertSingleValidationError(result);

        using var context = TestDb.Open(this.connection);
        var bill = await context.Bill.AsNoTracking().SingleAsync(b => b.Id == billId);
        Assert.Equal(categoryId, bill.CategoryId);
        Assert.Equal(subCategoryId, bill.SubCategoryId);
        Assert.Equal(12.5, bill.Price);
    }
}
