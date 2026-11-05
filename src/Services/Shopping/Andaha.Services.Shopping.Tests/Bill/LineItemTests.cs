using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill;
using Andaha.Services.Shopping.Requests.Bill.DeleteBill.V1;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.GetBillById.V1;
using Andaha.Services.Shopping.Requests.Bill.LineItems;
using Andaha.Services.Shopping.Requests.Bill.SearchBills.V1;
using Andaha.Services.Shopping.Requests.UserData.DeleteUserData.V1;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Primitives;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

/// <summary>
/// Line items of a bill (US-0009 §5.1): order, replace semantics on create/update through the multipart form field
/// <c>lineItems</c>, detail vs. list, rights and deletion. Requests run through the real endpoint form reading and the
/// MediatR pipeline (validators included) on SQLite.
/// </summary>
public sealed class LineItemTests : IDisposable
{
    private readonly Guid userId = Guid.NewGuid();
    private readonly Guid partnerId = Guid.NewGuid();
    private readonly Guid strangerId = Guid.NewGuid();
    private readonly SqliteConnection connection;
    private readonly Guid ownCategoryId;
    private readonly Guid strangerCategoryId;

    public LineItemTests()
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

    private WebApplication BuildApp(Guid actingUserId, params Guid[] connectedUsers)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(actingUserId);

        var collaborationApiProxy = Substitute.For<ICollaborationApiProxy>();
        collaborationApiProxy.GetConnectedUsers(Arg.Any<CancellationToken>()).Returns(connectedUsers);

        var builder = WebApplication.CreateBuilder();
        builder.AddCustomApplicationServices();

        // Test doubles; the last registration wins.
        builder.Services.AddScoped(_ => TestDb.Open(this.connection));
        builder.Services.AddSingleton(identity);
        builder.Services.AddSingleton(collaborationApiProxy);
        builder.Services.AddSingleton(Substitute.For<IImageRepository>());

        return builder.Build();
    }

    private async Task<IResult> SendAsync(IRequest<IResult> request, Guid? actingUserId = null, params Guid[] connectedUsers)
    {
        await using var app = this.BuildApp(actingUserId ?? this.userId, connectedUsers);
        using var scope = app.Services.CreateScope();

        return await scope.ServiceProvider.GetRequiredService<IMediator>().Send(request);
    }

    private enum FormEndpoint { Create, Update }

    private async Task<IResult> SubmitFormAsync(
        FormEndpoint endpoint,
        Dictionary<string, string> fields,
        Guid? billId = null,
        Guid? actingUserId = null,
        params Guid[] connectedUsers)
    {
        await using var app = this.BuildApp(actingUserId ?? this.userId, connectedUsers);
        using var scope = app.Services.CreateScope();

        var httpContext = new DefaultHttpContext { RequestServices = scope.ServiceProvider };
        httpContext.Request.Form = new FormCollection(
            fields.ToDictionary(field => field.Key, field => new StringValues(field.Value)));

        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        return endpoint == FormEndpoint.Create
            ? await BillEndpointExtensions.CreateBillFromFormAsync(mediator, httpContext, CancellationToken.None)
            : await BillEndpointExtensions.UpdateBillFromFormAsync(mediator, httpContext, CancellationToken.None, billId!.Value);
    }

    private Dictionary<string, string> BillFields(Guid? categoryId = null, string? lineItemsJson = null)
    {
        var fields = new Dictionary<string, string>
        {
            ["CategoryId"] = (categoryId ?? this.ownCategoryId).ToString(),
            ["ShopName"] = "ZZ Spar",
            ["Price"] = "12,50",
            ["Date"] = "2026-11-05T10:00:00Z",
            ["Notes"] = "",
        };

        if (lineItemsJson is not null)
        {
            fields["lineItems"] = lineItemsJson;
        }

        return fields;
    }

    private Guid SeedBill(Guid ownerId, Guid categoryId, params LineItemData[] items)
    {
        using var context = TestDb.Open(this.connection);

        var bill = new Core.Bill(null, ownerId, categoryId, null, "ZZ Seed", 12.5, new DateTime(2026, 11, 1));
        bill.ReplaceLineItems(items);
        context.Bill.Add(bill);
        context.SaveChanges();

        return bill.Id;
    }

    private Guid SeedPartnerBill(params LineItemData[] items)
    {
        using var context = TestDb.Open(this.connection);

        var category = new BillCategory(this.partnerId, "Partner", "#333333", 0, Array.Empty<(string, int)>());
        context.BillCategory.Add(category);
        context.SaveChanges();

        return this.SeedBill(this.partnerId, category.Id, items);
    }

    private List<BillLineItem> StoredItems(Guid billId)
    {
        using var context = TestDb.Open(this.connection);

        return context.BillLineItem.AsNoTracking()
            .Where(item => item.BillId == billId)
            .OrderBy(item => item.Position)
            .ToList();
    }

    private static readonly LineItemData[] ThreeItems =
    [
        new("Milch", 2, 1.29, 2.58),
        new("Brot", null, null, 2.49),
        new("Pfand", 1, -0.25, -0.25),
    ];

    [Fact]
    public async Task Create_with_lineItems_stores_them_in_order()
    {
        const string Json = """
            [
              { "description": "Zucchini", "quantity": 2, "unitPrice": 0.99, "totalPrice": 1.98 },
              { "description": "Äpfel ŁÓDŹ 🍎", "quantity": null, "unitPrice": null, "totalPrice": 3.49 },
              { "description": "Rabatt", "totalPrice": -0.50 }
            ]
            """;

        var result = await this.SubmitFormAsync(FormEndpoint.Create, this.BillFields(lineItemsJson: Json));

        var dto = Assert.IsType<Ok<BillDto>>(result).Value!;
        Assert.Equal(new[] { "Zucchini", "Äpfel ŁÓDŹ 🍎", "Rabatt" }, dto.LineItems.Select(item => item.Description));

        var stored = this.StoredItems(dto.Id);
        Assert.Equal(new[] { 0, 1, 2 }, stored.Select(item => item.Position));
        Assert.Equal(new[] { "Zucchini", "Äpfel ŁÓDŹ 🍎", "Rabatt" }, stored.Select(item => item.Description));
        Assert.Equal(2, stored[0].Quantity);
        Assert.Equal(0.99, stored[0].UnitPrice);
        Assert.Equal(1.98, stored[0].TotalPrice);
        Assert.Null(stored[1].Quantity);
        Assert.Equal(-0.50, stored[2].TotalPrice);
    }

    [Fact]
    public async Task Create_without_lineItems_field_creates_bill_without_items()
    {
        var result = await this.SubmitFormAsync(FormEndpoint.Create, this.BillFields());

        var dto = Assert.IsType<Ok<BillDto>>(result).Value!;
        Assert.Empty(dto.LineItems);
        Assert.Empty(this.StoredItems(dto.Id));
    }

    [Fact]
    public async Task Create_retry_with_existing_id_ignores_lineItems()
    {
        Guid billId = this.SeedBill(this.userId, this.ownCategoryId, ThreeItems);
        var fields = this.BillFields(lineItemsJson: """[{ "description": "Neu" }]""");
        fields["Id"] = billId.ToString();

        var result = await this.SubmitFormAsync(FormEndpoint.Create, fields);

        Assert.IsType<Ok<BillDto>>(result);
        Assert.Equal(new[] { "Milch", "Brot", "Pfand" }, this.StoredItems(billId).Select(item => item.Description));
    }

    [Fact]
    public async Task Update_replaces_lineItems()
    {
        Guid billId = this.SeedBill(this.userId, this.ownCategoryId, ThreeItems);

        var result = await this.SubmitFormAsync(
            FormEndpoint.Update,
            this.BillFields(lineItemsJson: """[{ "description": "Pfand" }, { "description": "Käse", "quantity": 1, "totalPrice": 4.2 }]"""),
            billId);

        var dto = Assert.IsType<Ok<BillDto>>(result).Value!;
        Assert.Equal(new[] { "Pfand", "Käse" }, dto.LineItems.Select(item => item.Description));

        var stored = this.StoredItems(billId);
        Assert.Equal(new[] { "Pfand", "Käse" }, stored.Select(item => item.Description));
        Assert.Equal(new[] { 0, 1 }, stored.Select(item => item.Position));
        Assert.Null(stored[0].TotalPrice);
        Assert.Equal(4.2, stored[1].TotalPrice);
    }

    [Fact]
    public async Task Update_without_lineItems_field_keeps_items()
    {
        Guid billId = this.SeedBill(this.userId, this.ownCategoryId, ThreeItems);
        var before = this.StoredItems(billId);

        var result = await this.SubmitFormAsync(FormEndpoint.Update, this.BillFields(), billId);

        Assert.IsType<Ok<BillDto>>(result);
        var after = this.StoredItems(billId);
        Assert.Equal(before.Select(item => item.Id), after.Select(item => item.Id));
        Assert.Equal(new[] { "Milch", "Brot", "Pfand" }, after.Select(item => item.Description));
    }

    [Fact]
    public async Task Update_with_empty_array_removes_items()
    {
        Guid billId = this.SeedBill(this.userId, this.ownCategoryId, ThreeItems);

        var result = await this.SubmitFormAsync(FormEndpoint.Update, this.BillFields(lineItemsJson: "[]"), billId);

        var dto = Assert.IsType<Ok<BillDto>>(result).Value!;
        Assert.Empty(dto.LineItems);
        Assert.Empty(this.StoredItems(billId));
    }

    [Theory]
    [InlineData("kein json")]
    [InlineData("{ \"description\": \"Milch\" }")]
    [InlineData("[null]")]
    [InlineData("[{ \"description\": \"Milch\", \"quantity\": 1.5 }]")]
    [InlineData("null")]
    [InlineData("")]
    public async Task Invalid_lineItems_json_returns_400(string json)
    {
        Guid billId = this.SeedBill(this.userId, this.ownCategoryId, ThreeItems);

        var createResult = await this.SubmitFormAsync(FormEndpoint.Create, this.BillFields(lineItemsJson: json));
        var updateResult = await this.SubmitFormAsync(FormEndpoint.Update, this.BillFields(lineItemsJson: json), billId);

        foreach (var result in new[] { createResult, updateResult })
        {
            var problem = Assert.IsType<ValidationProblem>(result);
            Assert.Equal(StatusCodes.Status400BadRequest, problem.StatusCode);
            Assert.Equal("lineItems", Assert.Single(problem.ProblemDetails.Errors).Key);
        }

        using var context = TestDb.Open(this.connection);
        Assert.Single(context.Bill.AsNoTracking());
        Assert.Equal(new[] { "Milch", "Brot", "Pfand" }, this.StoredItems(billId).Select(item => item.Description));
    }

    [Fact]
    public async Task Get_by_id_returns_items_ordered()
    {
        Guid billId = this.SeedBill(
            this.userId,
            this.ownCategoryId,
            new LineItemData("Zitrone", 1, 0.5, 0.5),
            new LineItemData("Apfel", 3, 0.4, 1.2),
            new LineItemData("Mango", null, null, 1.99));

        var result = await this.SendAsync(new GetBillByIdQuery(billId));

        var dto = Assert.IsType<Ok<BillDto>>(result).Value!;
        Assert.Equal(new[] { "Zitrone", "Apfel", "Mango" }, dto.LineItems.Select(item => item.Description));

        var stored = this.StoredItems(billId);
        Assert.Equal(stored.Select(item => item.Id), dto.LineItems.Select(item => item.Id));

        var apple = dto.LineItems.ElementAt(1);
        Assert.Equal(3, apple.Quantity);
        Assert.Equal(0.4, apple.UnitPrice);
        Assert.Equal(1.2, apple.TotalPrice);
    }

    [Fact]
    public async Task Search_list_returns_no_items()
    {
        this.SeedBill(this.userId, this.ownCategoryId, ThreeItems);

        var result = await this.SendAsync(new SearchBillsQuery(20, 0, null, null, null, null));

        var list = Assert.IsType<Ok<BillSearchResultDto>>(result).Value!;
        var bill = Assert.Single(list.Values);
        Assert.NotNull(bill.LineItems);
        Assert.Empty(bill.LineItems);
    }

    [Fact]
    public async Task Partner_can_read_but_not_change_items()
    {
        // A connected user reads the partner's items through GET {id}.
        Guid partnerBillId = this.SeedPartnerBill(ThreeItems);

        var read = await this.SendAsync(new GetBillByIdQuery(partnerBillId), this.userId, this.partnerId);

        var dto = Assert.IsType<Ok<BillDto>>(read).Value!;
        Assert.True(dto.IsExternal);
        Assert.Equal(new[] { "Milch", "Brot", "Pfand" }, dto.LineItems.Select(item => item.Description));

        // Changing follows the existing bill rules: a user who is not connected can neither read nor change the items.
        var strangerRead = await this.SendAsync(new GetBillByIdQuery(partnerBillId), this.strangerId);
        Assert.IsType<NotFound<string>>(strangerRead);

        var strangerUpdate = await this.SubmitFormAsync(
            FormEndpoint.Update,
            this.BillFields(this.strangerCategoryId, """[{ "description": "Gehackt" }]"""),
            partnerBillId,
            this.strangerId);
        Assert.IsNotType<Ok<BillDto>>(strangerUpdate);

        Assert.Equal(new[] { "Milch", "Brot", "Pfand" }, this.StoredItems(partnerBillId).Select(item => item.Description));
    }

    [Fact]
    public async Task Deleting_bill_removes_items()
    {
        Guid billId = this.SeedBill(this.userId, this.ownCategoryId, ThreeItems);
        Guid otherBillId = this.SeedBill(this.userId, this.ownCategoryId, new LineItemData("Bleibt", null, null, 1));

        var result = await this.SendAsync(new DeleteBillCommand(billId));

        Assert.IsType<NoContent>(result);
        Assert.Empty(this.StoredItems(billId));
        Assert.Single(this.StoredItems(otherBillId));
    }

    [Fact]
    public async Task DeleteUserData_removes_items()
    {
        Guid billId = this.SeedBill(this.userId, this.ownCategoryId, ThreeItems);
        Guid strangersBillId = this.SeedBill(this.strangerId, this.strangerCategoryId, new LineItemData("Bleibt", null, null, 1));

        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(this.userId);
        var analysisImageRepository = Substitute.For<IAnalysisImageRepository>();
        analysisImageRepository.ListImagesAsync(Arg.Any<CancellationToken>()).Returns(Array.Empty<ImageMetadata>());

        using (var context = TestDb.Open(this.connection))
        {
            var handler = new DeleteUserDataCommandHandler(
                context,
                identity,
                Substitute.For<IImageRepository>(),
                analysisImageRepository,
                NullLogger<DeleteUserDataCommandHandler>.Instance);

            Assert.IsType<NoContent>(await handler.Handle(new DeleteUserDataCommand(), CancellationToken.None));
        }

        Assert.Empty(this.StoredItems(billId));
        Assert.Single(this.StoredItems(strangersBillId));
    }
}
