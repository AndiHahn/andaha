using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.GetAnalyzedBillImage.V1;
using Andaha.Services.Shopping.Requests.Bill.GetAnalyzedBills.V1;
using Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class AnalysisTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private static IIdentityService Identity(Guid user)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(user);
        return identity;
    }

    private static IFormFile File(long length)
    {
        var file = Substitute.For<IFormFile>();
        file.Length.Returns(length);
        file.OpenReadStream().Returns(_ => new MemoryStream(new byte[] { 1, 2, 3 }));
        return file;
    }

    [Fact]
    public async Task Upload_stores_image_in_analysis_repository_with_user()
    {
        var repository = Substitute.For<IAnalysisImageRepository>();
        var handler = new UploadBillForAnalysisCommandHandler(repository, Identity(UserA));

        var result = await handler.Handle(new UploadBillForAnalysisCommand(File(3)), CancellationToken.None);

        Assert.IsType<Accepted>(result);
        await repository.Received(1).UploadImageAsync(
            Arg.Is<string>(n => n.Length == 36),
            Arg.Any<Stream>(),
            UserA,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Upload_without_file_returns_bad_request()
    {
        var repository = Substitute.For<IAnalysisImageRepository>();
        var handler = new UploadBillForAnalysisCommandHandler(repository, Identity(UserA));

        var result = await handler.Handle(new UploadBillForAnalysisCommand(File(0)), CancellationToken.None);

        Assert.IsType<BadRequest<Microsoft.AspNetCore.Mvc.ProblemDetails>>(result);
        await repository.DidNotReceiveWithAnyArgs().UploadImageAsync(default!, default!, default, default);
    }

    [Fact]
    public async Task AnalyzedBills_list_contains_confidence_and_image_flag()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var withImage = new AnalyzedBill(UserA, null, null, "Shop", 10, 0.87, 0.5, DateTime.UtcNow);
            withImage.AddImage("img", new byte[] { 1 });
            var withoutImage = new AnalyzedBill(UserA, null, null, "Other", 5, 0.4, null, DateTime.UtcNow.AddDays(-1));
            context.AnalyzedBill.AddRange(withImage, withoutImage);
            context.SaveChanges();

            var handler = new GetAnalyzedBillsQueryHandler(context, Identity(UserA));
            var result = await handler.Handle(new GetAnalyzedBillsQuery(), CancellationToken.None);

            var list = Assert.IsType<Ok<List<AnalyzedBillDto>>>(result).Value!;
            var a = Assert.Single(list, b => b.Id == withImage.Id);
            var b = Assert.Single(list, b => b.Id == withoutImage.Id);
            Assert.Equal(0.87, a.Confidence);
            Assert.Equal(0.5, a.TotalAmountConfidence);
            Assert.True(a.ImageAvailable);
            Assert.False(b.ImageAvailable);
        }
    }

    [Fact]
    public async Task AnalyzedBill_image_returns_image_for_creator()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = new AnalyzedBill(UserA, null, null, "Shop", 10, 0.9, null);
            bill.AddImage("img-name", new byte[] { 1 });
            context.AnalyzedBill.Add(bill);
            context.SaveChanges();
            var images = Substitute.For<IImageRepository>();
            images.GetImageStreamAsync("img-name", Arg.Any<CancellationToken>())
                .Returns(_ => new MemoryStream(new byte[] { 9, 8 }));

            var handler = new GetAnalyzedBillImageQueryHandler(context, Identity(UserA), images);
            var result = await handler.Handle(new GetAnalyzedBillImageQuery(bill.Id), CancellationToken.None);

            var file = Assert.IsType<FileContentHttpResult>(result);
            Assert.Equal("image/png", file.ContentType);
            Assert.Equal(new byte[] { 9, 8 }, file.FileContents.ToArray());
        }
    }

    [Fact]
    public async Task AnalyzedBill_image_returns_not_found_without_image()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = new AnalyzedBill(UserA, null, null, "Shop", 10, 0.9, null);
            context.AnalyzedBill.Add(bill);
            context.SaveChanges();

            var handler = new GetAnalyzedBillImageQueryHandler(context, Identity(UserA), Substitute.For<IImageRepository>());

            Assert.IsType<NotFound<string>>(await handler.Handle(new GetAnalyzedBillImageQuery(bill.Id), CancellationToken.None));
            Assert.IsType<NotFound<string>>(await handler.Handle(new GetAnalyzedBillImageQuery(Guid.NewGuid()), CancellationToken.None));
        }
    }

    [Fact]
    public async Task AnalyzedBill_image_forbids_other_user()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = new AnalyzedBill(UserA, null, null, "Shop", 10, 0.9, null);
            bill.AddImage("img-name", new byte[] { 1 });
            context.AnalyzedBill.Add(bill);
            context.SaveChanges();

            var handler = new GetAnalyzedBillImageQueryHandler(context, Identity(UserB), Substitute.For<IImageRepository>());
            var result = await handler.Handle(new GetAnalyzedBillImageQuery(bill.Id), CancellationToken.None);

            Assert.IsType<ForbidHttpResult>(result);
        }
    }
}
