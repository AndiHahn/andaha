using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;
using Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class AnalyzeBillResultTests
{
    private static readonly Guid User = Guid.NewGuid();

    private static IIdentityService Identity()
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(User);
        return identity;
    }

    private static IInvoiceAnalysisService Analysis()
    {
        var analysis = Substitute.For<IInvoiceAnalysisService>();
        analysis.AnalyzeAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns(new InvoiceAnalysisResult
            {
                VendorName = "Billa",
                InvoiceDate = new DateTimeOffset(2026, 3, 14, 17, 45, 12, TimeSpan.FromHours(1)),
                TotalAmount = 12.5,
                Confidence = 0.91,
                LineItems =
                [
                    new InvoiceLineItem { Description = "Milch", Quantity = 2, UnitPrice = 1.25, TotalPrice = 2.5 },
                    new InvoiceLineItem { Description = "Brot", Quantity = null, UnitPrice = null, TotalPrice = 10 },
                ],
            });
        return analysis;
    }

    private static ICategoryClassificationService Classification(Guid categoryId, Guid? subCategoryId)
    {
        var classification = Substitute.For<ICategoryClassificationService>();
        classification.ClassifyAsync(Arg.Any<string?>(), Arg.Any<string[]>(), Arg.Any<BillCategory[]>(), Arg.Any<CancellationToken>())
            .Returns(new CategoryClassificationResult { CategoryId = categoryId, SubCategoryId = subCategoryId });
        return classification;
    }

    [Fact]
    public async Task Analyze_returns_typed_result_with_date_only_and_valid_classification()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var category = new BillCategory(User, "Lebensmittel", "#111111", 0, new[] { ("Supermarkt", 0) });
            var subCategory = category.SubCategories.Single();
            context.BillCategory.Add(category);
            context.SaveChanges();

            var handler = new AnalyzeBillCommandHandler(
                Analysis(),
                Classification(category.Id, subCategory.Id),
                Identity(),
                context,
                NullLogger<AnalyzeBillCommandHandler>.Instance);

            var result = await handler.Handle(new AnalyzeBillCommand(new MemoryStream([1, 2, 3])), CancellationToken.None);

            var dto = Assert.IsType<Ok<AnalyzeBillResultDto>>(result).Value!;
            Assert.Equal("Billa", dto.ShopName);
            Assert.Equal(new DateTime(2026, 3, 14), dto.Date);
            Assert.Equal(TimeSpan.Zero, dto.Date!.Value.TimeOfDay);
            Assert.Equal(12.5, dto.TotalAmount);
            Assert.Equal(category.Id, dto.CategoryId);
            Assert.Equal(subCategory.Id, dto.SubCategoryId);
            Assert.Equal(0.91, dto.Confidence);
            Assert.Collection(
                dto.LineItems,
                first =>
                {
                    Assert.Equal("Milch", first.Description);
                    Assert.Equal(2d, first.Quantity);
                    Assert.Equal(1.25, first.UnitPrice);
                    Assert.Equal(2.5, first.TotalPrice);
                },
                second =>
                {
                    Assert.Equal("Brot", second.Description);
                    Assert.Null(second.Quantity);
                    Assert.Null(second.UnitPrice);
                    Assert.Equal(10, second.TotalPrice);
                });
        }
    }

    [Fact]
    public async Task Analyze_drops_invalid_classification()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var handler = new AnalyzeBillCommandHandler(
                Analysis(),
                Classification(Guid.NewGuid(), null),
                Identity(),
                context,
                NullLogger<AnalyzeBillCommandHandler>.Instance);

            var result = await handler.Handle(new AnalyzeBillCommand(new MemoryStream([1, 2, 3])), CancellationToken.None);

            var dto = Assert.IsType<Ok<AnalyzeBillResultDto>>(result).Value!;
            Assert.Null(dto.CategoryId);
            Assert.Null(dto.SubCategoryId);
            Assert.Equal("Billa", dto.ShopName);
        }
    }
}
