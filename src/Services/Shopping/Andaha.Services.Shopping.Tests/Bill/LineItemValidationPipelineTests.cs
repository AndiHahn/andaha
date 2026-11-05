using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.LineItems;
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
/// Line item rules of the create/update validators, run through the MediatR pipeline (HttpResultValidationBehavior).
/// </summary>
public sealed class LineItemValidationPipelineTests : IDisposable
{
    private readonly Guid userId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly Guid categoryId;

    public LineItemValidationPipelineTests()
    {
        Infrastructure.ShoppingDbContext seedContext;
        (seedContext, this.connection) = TestDb.CreateShopping();

        using (seedContext)
        {
            var own = new BillCategory(this.userId, "Eigene", "#111111", 0, Array.Empty<(string, int)>());
            seedContext.BillCategory.Add(own);
            seedContext.SaveChanges();

            this.categoryId = own.Id;
        }
    }

    public void Dispose() => this.connection.Dispose();

    private async Task<IResult> SendAsync(IRequest<IResult> request)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(this.userId);

        var collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();
        collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>()).Returns(Array.Empty<Guid>());

        var builder = WebApplication.CreateBuilder();
        builder.AddCustomApplicationServices();
        builder.Services.AddScoped(_ => TestDb.Open(this.connection));
        builder.Services.AddSingleton(identity);
        builder.Services.AddSingleton(collaborationApiProxy);

        await using var app = builder.Build();
        using var scope = app.Services.CreateScope();

        return await scope.ServiceProvider.GetRequiredService<IMediator>().Send(request);
    }

    private Guid SeedBill()
    {
        using var context = TestDb.Open(this.connection);

        var bill = new Core.Bill(null, this.userId, this.categoryId, null, "ZZ Seed", 12.5, DateTime.UtcNow);
        bill.ReplaceLineItems([new LineItemData("Milch", 1, 1.29, 1.29)]);
        context.Bill.Add(bill);
        context.SaveChanges();

        return bill.Id;
    }

    private CreateBillCommand Create(IReadOnlyList<LineItemData> items)
        => new(null, this.categoryId, null, "ZZ Shop", 12.5, DateTime.UtcNow, null, null, items);

    private UpdateBillCommand Update(Guid billId, IReadOnlyList<LineItemData> items)
        => new(billId, this.categoryId, null, "ZZ Shop", 12.5, DateTime.UtcNow, null, null, items);

    private static LineItemData[] Items(int count)
        => Enumerable.Range(1, count).Select(index => new LineItemData($"Position {index}", 1, 1, 1)).ToArray();

    public static TheoryData<string, LineItemData[]> InvalidItems => new()
    {
        { "201 Positionen", Items(201) },
        { "leere Beschreibung", [new LineItemData("", 1, 1, 1)] },
        { "Beschreibung nur Leerzeichen", [new LineItemData("   ", 1, 1, 1)] },
        { "Beschreibung über 200 Zeichen", [new LineItemData(new string('x', 201), 1, 1, 1)] },
        { "Menge 0", [new LineItemData("Milch", 0, 1, 1)] },
        { "Menge negativ", [new LineItemData("Milch", -2, 1, 1)] },
    };

    private static void AssertSingleValidationError(IResult result)
    {
        var problem = Assert.IsType<ValidationProblem>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.StatusCode);
        Assert.Single(problem.ProblemDetails.Errors.SelectMany(error => error.Value));
    }

    [Theory]
    [MemberData(nameof(InvalidItems))]
    public async Task Create_with_invalid_lineItems_returns_400_and_saves_nothing(string _, LineItemData[] items)
    {
        var result = await this.SendAsync(this.Create(items));

        AssertSingleValidationError(result);

        using var context = TestDb.Open(this.connection);
        Assert.Empty(context.Bill.AsNoTracking());
        Assert.Empty(context.BillLineItem.AsNoTracking());
    }

    [Theory]
    [MemberData(nameof(InvalidItems))]
    public async Task Update_with_invalid_lineItems_returns_400_and_keeps_items(string _, LineItemData[] items)
    {
        Guid billId = this.SeedBill();

        var result = await this.SendAsync(this.Update(billId, items));

        AssertSingleValidationError(result);

        using var context = TestDb.Open(this.connection);
        var stored = Assert.Single(context.BillLineItem.AsNoTracking());
        Assert.Equal("Milch", stored.Description);
    }

    [Fact]
    public async Task Create_with_200_items_negative_prices_and_without_quantity_is_valid()
    {
        var items = Items(198)
            .Append(new LineItemData("Rabatt", null, null, -0.5))
            .Append(new LineItemData(" " + new string('y', 200) + " ", 1, -1, -1))
            .ToArray();

        var result = await this.SendAsync(this.Create(items));

        var dto = Assert.IsType<Ok<BillDto>>(result).Value!;
        Assert.Equal(200, dto.LineItems.Count);
        Assert.Equal(new string('y', 200), dto.LineItems.Last().Description);
    }
}
