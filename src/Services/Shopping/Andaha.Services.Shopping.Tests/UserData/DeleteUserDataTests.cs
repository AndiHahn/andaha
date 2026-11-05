using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Requests.UserData.DeleteUserData.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Andaha.Services.Shopping.Tests.UserData;

public class DeleteUserDataTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private sealed record SeededUser(
        Core.BillCategory DefaultCategory,
        Core.BillCategory Food,
        Core.Bill Bill,
        AnalyzedBill AnalyzedBill,
        Core.BillTemplate Template,
        HiddenBillSuggestion Hidden,
        string BillImageName,
        string AnalyzedImageName);

    private sealed class Fixture
    {
        public IImageRepository ImageRepository { get; } = Substitute.For<IImageRepository>();

        public IAnalysisImageRepository AnalysisImageRepository { get; } = Substitute.For<IAnalysisImageRepository>();

        public Fixture(params ImageMetadata[] pendingUploads)
        {
            this.AnalysisImageRepository
                .ListImagesAsync(Arg.Any<CancellationToken>())
                .Returns(pendingUploads);
        }

        // The handler always runs on its own context (as in a request scope), not on the one used for seeding.
        public async Task<IResult> DeleteAsync(SqliteConnection connection, Guid userId)
        {
            using var context = NewContext(connection);

            var identity = Substitute.For<IIdentityService>();
            identity.GetUserId().Returns(userId);

            var handler = new DeleteUserDataCommandHandler(
                context,
                identity,
                this.ImageRepository,
                this.AnalysisImageRepository,
                NullLogger<DeleteUserDataCommandHandler>.Instance);

            return await handler.Handle(new DeleteUserDataCommand(), CancellationToken.None);
        }
    }

    private static ShoppingDbContext NewContext(SqliteConnection connection)
        => new(new DbContextOptionsBuilder<ShoppingDbContext>().UseSqlite(connection).Options);

    private static ImageMetadata Pending(string name, Guid? userId) => new()
    {
        ImageName = name,
        LastModified = DateTimeOffset.UtcNow,
        UserId = userId,
    };

    private static SeededUser Seed(ShoppingDbContext context, Guid userId, string prefix)
    {
        var defaultCategory = new Core.BillCategory(
            userId, "Keine", "white", 0, Array.Empty<(string, int)>(), includeToStatistics: false, isDefault: true);
        var food = new Core.BillCategory(userId, "Lebensmittel", "red", 1, new[] { ("Obst", 0) });
        context.BillCategory.AddRange(defaultCategory, food);
        context.SaveChanges();

        string billImageName = $"{prefix}-bill.jpg";
        var bill = new Core.Bill(null, userId, food.Id, food.SubCategories.Single().Id, "Spar", 12.5, new DateTime(2026, 3, 1));
        bill.AddLineItem("Äpfel", 2.5, 5.0, 2);
        bill.AddImage(billImageName, [1, 2, 3]);
        context.Bill.Add(bill);

        string analyzedImageName = $"{prefix}-analyzed.jpg";
        var analyzedBill = new AnalyzedBill(userId, food.Id, null, "Hofer", 7.0, 0.9, 0.9, new DateTime(2026, 3, 2));
        analyzedBill.AddLineItem("Brot", 3.5, 7.0, 2);
        analyzedBill.AddImage(analyzedImageName, [4, 5, 6]);
        context.AnalyzedBill.Add(analyzedBill);

        var template = new Core.BillTemplate(userId, "Wocheneinkauf", "Spar", food.Id, food.SubCategories.Single().Id, 0);
        context.BillTemplate.Add(template);

        var hidden = new HiddenBillSuggestion(userId, "Billa", food.Id, null);
        context.HiddenBillSuggestion.Add(hidden);

        context.SaveChanges();

        return new SeededUser(defaultCategory, food, bill, analyzedBill, template, hidden, billImageName, analyzedImageName);
    }

    // The predicates run in the database (Any on the query), so navigations need no Include.
    private static void AssertNothingLeftFor(ShoppingDbContext context, Guid userId)
    {
        Assert.False(context.Bill.Any(b => b.UserId == userId));
        Assert.False(context.BillLineItem.Any(l => l.Bill.UserId == userId));
        Assert.False(context.BillImage.Any(i => i.Bill!.UserId == userId || i.AnalyzedBill!.UserId == userId));
        Assert.False(context.AnalyzedBill.Any(b => b.UserId == userId));
        Assert.False(context.AnalyzedBillLineItem.Any(l => l.Bill.UserId == userId));
        Assert.False(context.BillTemplate.Any(t => t.UserId == userId));
        Assert.False(context.HiddenBillSuggestion.Any(h => h.UserId == userId));
        Assert.False(context.BillCategory.Any(c => c.UserId == userId));
        Assert.False(context.BillSubCategory.Any(s => s.Category.UserId == userId));
    }

    [Fact]
    public async Task DeleteUserData_removes_all_own_rows_and_image_blobs()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var seeded = Seed(context, UserA, "a");
            var fixture = new Fixture(
                Pending("pending-a.jpg", UserA),
                Pending("pending-b.jpg", UserB),
                Pending("without-owner.jpg", null));

            var result = await fixture.DeleteAsync(connection, UserA);

            Assert.IsType<NoContent>(result);
            AssertNothingLeftFor(context, UserA);
            Assert.Empty(context.BillImage.AsNoTracking());
            Assert.Empty(context.BillLineItem.AsNoTracking());
            Assert.Empty(context.AnalyzedBillLineItem.AsNoTracking());
            Assert.Empty(context.BillSubCategory.AsNoTracking());

            await fixture.ImageRepository.Received(1).DeleteImageAsync(seeded.BillImageName, Arg.Any<CancellationToken>());
            await fixture.ImageRepository.Received(1).DeleteImageAsync(seeded.AnalyzedImageName, Arg.Any<CancellationToken>());
            await fixture.AnalysisImageRepository.Received(1).DeleteImageAsync("pending-a.jpg", Arg.Any<CancellationToken>());
            await fixture.AnalysisImageRepository.DidNotReceive().DeleteImageAsync("pending-b.jpg", Arg.Any<CancellationToken>());
            await fixture.AnalysisImageRepository.DidNotReceive().DeleteImageAsync("without-owner.jpg", Arg.Any<CancellationToken>());
        }
    }

    [Fact]
    public async Task DeleteUserData_moves_partner_bills_to_partner_default_category()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var seededA = Seed(context, UserA, "a");
            var defaultB = new Core.BillCategory(
                UserB, "Keine", "white", 0, Array.Empty<(string, int)>(), includeToStatistics: false, isDefault: true);
            context.BillCategory.Add(defaultB);
            context.SaveChanges();

            // A connected partner booked a bill into A's category and sub category.
            var partnerBill = new Core.Bill(
                null, UserB, seededA.Food.Id, seededA.Food.SubCategories.Single().Id, "Spar", 20.0, new DateTime(2026, 3, 3));
            partnerBill.AddImage("b-bill.jpg", [7]);
            context.Bill.Add(partnerBill);
            context.SaveChanges();

            var fixture = new Fixture();

            var result = await fixture.DeleteAsync(connection, UserA);

            Assert.IsType<NoContent>(result);
            var stored = context.Bill.AsNoTracking().SingleOrDefault(b => b.Id == partnerBill.Id);
            Assert.NotNull(stored);
            Assert.Equal(defaultB.Id, stored.CategoryId);
            Assert.Null(stored.SubCategoryId);
            Assert.Single(context.BillImage.AsNoTracking(), i => i.BillId == partnerBill.Id);

            // No default category was seeded for the user being deleted.
            AssertNothingLeftFor(context, UserA);
            Assert.Equal(new[] { defaultB.Id }, context.BillCategory.AsNoTracking().Select(c => c.Id).ToArray());
            await fixture.ImageRepository.DidNotReceive().DeleteImageAsync("b-bill.jpg", Arg.Any<CancellationToken>());
        }
    }

    [Fact]
    public async Task DeleteUserData_keeps_other_users_data()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            Seed(context, UserA, "a");
            var seededB = Seed(context, UserB, "b");
            var fixture = new Fixture(Pending("pending-b.jpg", UserB));

            var result = await fixture.DeleteAsync(connection, UserA);

            Assert.IsType<NoContent>(result);
            AssertNothingLeftFor(context, UserA);

            var billB = context.Bill.AsNoTracking()
                .Include(b => b.LineItems)
                .Include(b => b.Images)
                .Single(b => b.UserId == UserB);
            Assert.Equal(seededB.Bill.Id, billB.Id);
            Assert.Equal(seededB.Food.Id, billB.CategoryId);
            Assert.Equal(seededB.Food.SubCategories.Single().Id, billB.SubCategoryId);
            Assert.Single(billB.LineItems);
            Assert.Single(billB.Images);

            var analyzedB = context.AnalyzedBill.AsNoTracking()
                .Include(b => b.LineItems)
                .Include(b => b.Images)
                .Single(b => b.UserId == UserB);
            Assert.Single(analyzedB.LineItems);
            Assert.Single(analyzedB.Images);

            Assert.Equal(2, context.BillCategory.AsNoTracking().Count(c => c.UserId == UserB));
            Assert.Single(context.BillSubCategory.AsNoTracking());
            Assert.Single(context.BillTemplate.AsNoTracking(), t => t.Id == seededB.Template.Id);
            Assert.Single(context.HiddenBillSuggestion.AsNoTracking(), h => h.Id == seededB.Hidden.Id);

            await fixture.ImageRepository.DidNotReceive().DeleteImageAsync(seededB.BillImageName, Arg.Any<CancellationToken>());
            await fixture.ImageRepository.DidNotReceive().DeleteImageAsync(seededB.AnalyzedImageName, Arg.Any<CancellationToken>());
            await fixture.AnalysisImageRepository.DidNotReceive().DeleteImageAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
        }
    }

    [Fact]
    public async Task DeleteUserData_twice_returns_no_content()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            Seed(context, UserA, "a");
            var fixture = new Fixture();

            var first = await fixture.DeleteAsync(connection, UserA);
            var second = await fixture.DeleteAsync(connection, UserA);

            Assert.IsType<NoContent>(first);
            Assert.IsType<NoContent>(second);
            AssertNothingLeftFor(context, UserA);
        }
    }

    [Fact]
    public async Task DeleteUserData_continues_when_a_blob_cannot_be_deleted()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var seeded = Seed(context, UserA, "a");
            var fixture = new Fixture(Pending("pending-a.jpg", UserA));
            fixture.ImageRepository
                .DeleteImageAsync(seeded.BillImageName, Arg.Any<CancellationToken>())
                .ThrowsAsync(new IOException("storage unavailable"));

            var result = await fixture.DeleteAsync(connection, UserA);

            Assert.IsType<NoContent>(result);
            AssertNothingLeftFor(context, UserA);
            await fixture.ImageRepository.Received(1).DeleteImageAsync(seeded.AnalyzedImageName, Arg.Any<CancellationToken>());
            await fixture.AnalysisImageRepository.Received(1).DeleteImageAsync("pending-a.jpg", Arg.Any<CancellationToken>());
        }
    }
}
