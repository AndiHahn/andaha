using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Expense.ExportExpenses.V1;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Expense;

public class ExportCategoryFilterTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid PartnerB = Guid.NewGuid();
    private static readonly Guid StrangerC = Guid.NewGuid();

    private static void Seed(Infrastructure.ShoppingDbContext context)
    {
        var foodA = new BillCategory(UserA, "Lebensmittel", "red", 0, Array.Empty<(string, int)>());
        var homeA = new BillCategory(UserA, "Wohnen", "pink", 1, Array.Empty<(string, int)>());
        var foodB = new BillCategory(PartnerB, "Lebensmittel", "red", 0, Array.Empty<(string, int)>());
        var leisureB = new BillCategory(PartnerB, "Freizeit", "indigo", 1, Array.Empty<(string, int)>());
        var foodC = new BillCategory(StrangerC, "Lebensmittel", "red", 0, Array.Empty<(string, int)>());
        context.BillCategory.AddRange(foodA, homeA, foodB, leisureB, foodC);
        context.SaveChanges();

        var date = new DateTime(2026, 3, 15);
        context.Bill.AddRange(
            new Core.Bill(null, UserA, foodA.Id, null, "A-Lebensmittel", 1.0, date),
            new Core.Bill(null, UserA, homeA.Id, null, "A-Wohnen", 2.0, date),
            new Core.Bill(null, PartnerB, foodB.Id, null, "B-Lebensmittel", 3.0, date),
            new Core.Bill(null, PartnerB, leisureB.Id, null, "B-Freizeit", 4.0, date),
            new Core.Bill(null, StrangerC, foodC.Id, null, "C-Lebensmittel", 5.0, date));
        context.SaveChanges();
    }

    private static async Task<List<string>> ExportShopNamesAsync(string[]? categoryFilter)
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            Seed(context);

            var identity = Substitute.For<IIdentityService>();
            identity.GetUserId().Returns(UserA);
            var collaboration = Substitute.For<ICollaborationApiProxy>();
            collaboration.GetConnectedUsers(Arg.Any<CancellationToken>()).Returns(new[] { PartnerB });
            var handler = new ExportExpensesRequestHandler(context, identity, collaboration);

            var result = await handler.Handle(
                new ExportExpensesRequest(new DateTime(2026, 1, 1), new DateTime(2026, 12, 31), categoryFilter),
                CancellationToken.None);

            var file = Assert.IsType<FileStreamHttpResult>(result);
            using var workbook = new XLWorkbook(file.FileStream);
            var sheet = workbook.Worksheet("Gesamt");
            return sheet.Column("B").CellsUsed()
                .Where(cell => cell.Address.RowNumber >= 5)
                .Select(cell => cell.GetString())
                .OrderBy(name => name)
                .ToList();
        }
    }

    [Fact]
    public async Task Export_with_category_names_filters_including_connected_users()
    {
        var shopNames = await ExportShopNamesAsync(new[] { "Lebensmittel" });

        Assert.Equal(new[] { "A-Lebensmittel", "B-Lebensmittel" }, shopNames);
    }

    [Fact]
    public async Task Export_without_category_filter_contains_all_own_and_connected_bills()
    {
        var shopNames = await ExportShopNamesAsync(null);

        Assert.Equal(new[] { "A-Lebensmittel", "A-Wohnen", "B-Freizeit", "B-Lebensmittel" }, shopNames);
    }

    [Fact]
    public async Task Export_with_empty_category_filter_contains_all_own_and_connected_bills()
    {
        var shopNames = await ExportShopNamesAsync(Array.Empty<string>());

        Assert.Equal(new[] { "A-Lebensmittel", "A-Wohnen", "B-Freizeit", "B-Lebensmittel" }, shopNames);
    }
}
