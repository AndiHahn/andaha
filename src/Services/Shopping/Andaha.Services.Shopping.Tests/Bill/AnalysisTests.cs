using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.BackgroundJobs;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.GetAnalyzedBillImage.V1;
using Andaha.Services.Shopping.Requests.Bill.GetAnalyzedBills.V1;
using Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.DependencyInjection;
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
        var handler = new UploadBillForAnalysisCommandHandler(repository, Identity(UserA), new AnalysisQueue(), TimeProvider.System);

        var result = await handler.Handle(new UploadBillForAnalysisCommand(File(3)), CancellationToken.None);

        var accepted = Assert.IsType<Accepted<UploadBillForAnalysisResponse>>(result);
        await repository.Received(1).UploadImageAsync(
            accepted.Value!.Id,
            Arg.Any<Stream>(),
            UserA,
            Arg.Any<AnalysisUploadOptions>(),
            Arg.Any<CancellationToken>());
        Assert.Equal(36, accepted.Value.Id.Length);
    }

    [Fact]
    public async Task Upload_without_file_returns_bad_request()
    {
        var repository = Substitute.For<IAnalysisImageRepository>();
        var queue = new AnalysisQueue();
        var handler = new UploadBillForAnalysisCommandHandler(repository, Identity(UserA), queue, TimeProvider.System);

        var result = await handler.Handle(new UploadBillForAnalysisCommand(File(0)), CancellationToken.None);

        Assert.IsType<BadRequest<Microsoft.AspNetCore.Mvc.ProblemDetails>>(result);
        await repository.DidNotReceiveWithAnyArgs().UploadImageAsync(default!, default!, default, default!, default);
        Assert.False(queue.TryDequeue(out _));
    }

    [Theory]
    [InlineData("3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b")]
    [InlineData(null)]
    public async Task Upload_command_binds_file_and_optional_id_from_multipart_form(string? id)
    {
        UploadBillForAnalysisCommand? bound = null;
        using var services = new ServiceCollection().AddLogging().BuildServiceProvider();
        var endpoint = RequestDelegateFactory.Create(
            ([AsParameters] UploadBillForAnalysisCommand command) => { bound = command; return Results.Ok(); },
            new RequestDelegateFactoryOptions { ServiceProvider = services });

        var fields = new Dictionary<string, Microsoft.Extensions.Primitives.StringValues>();
        if (id is not null)
        {
            fields["id"] = id;
        }

        var file = new FormFile(new MemoryStream([1, 2, 3]), 0, 3, "file", "bon.jpg");
        var httpContext = new DefaultHttpContext { RequestServices = services };
        httpContext.Request.Method = HttpMethods.Post;
        httpContext.Request.ContentType = "multipart/form-data; boundary=x";
        httpContext.Features.Set<Microsoft.AspNetCore.Http.Features.IFormFeature>(
            new Microsoft.AspNetCore.Http.Features.FormFeature(new FormCollection(fields, new FormFileCollection { file })));

        await endpoint.RequestDelegate(httpContext);

        Assert.NotNull(bound);
        Assert.Same(file, bound.File);
        Assert.Equal(id, bound.Id);
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
    public async Task AnalyzedBills_list_contains_stored_not_created_reasons()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = new AnalyzedBill(
                UserA, null, null, "Shop", 10, 0.9, 0.9, DateTime.UtcNow, null,
                [NotCreatedReason.DateMissing, NotCreatedReason.CategoryUnclear]);
            context.AnalyzedBill.Add(bill);
            context.SaveChanges();
            context.ChangeTracker.Clear();

            var handler = new GetAnalyzedBillsQueryHandler(context, Identity(UserA));
            var result = await handler.Handle(new GetAnalyzedBillsQuery(), CancellationToken.None);

            var dto = Assert.Single(Assert.IsType<Ok<List<AnalyzedBillDto>>>(result).Value!);
            Assert.Equal(["DateMissing", "CategoryUnclear"], dto.NotCreatedReasons);
        }
    }

    [Fact]
    public async Task AnalyzedBills_list_derives_reasons_for_legacy_rows()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var legacy = new AnalyzedBill(UserA, null, null, "Billa", 10, 0.5, 0.5, DateTime.UtcNow);
            var failed = new AnalyzedBill(UserA, null, null, null, null, null, null, DateTime.UtcNow.AddDays(-1));
            context.AnalyzedBill.AddRange(legacy, failed);
            context.SaveChanges();
            context.ChangeTracker.Clear();

            var handler = new GetAnalyzedBillsQueryHandler(context, Identity(UserA));
            var result = await handler.Handle(new GetAnalyzedBillsQuery(), CancellationToken.None);

            var list = Assert.IsType<Ok<List<AnalyzedBillDto>>>(result).Value!;
            Assert.Equal(
                ["LowConfidence", "AmountUncertain", "CategoryUnclear"],
                Assert.Single(list, d => d.Id == legacy.Id).NotCreatedReasons);
            Assert.Equal(["AnalysisFailed"], Assert.Single(list, d => d.Id == failed.Id).NotCreatedReasons);
        }
    }

    [Fact]
    public async Task AnalyzedBills_list_returns_line_items_by_position()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var analyzed = new AnalyzedBill(UserA, null, null, "Shop", 10, 0.5, 0.5, DateTime.UtcNow);
            analyzed.LineItems.Add(new AnalyzedBillLineItem(analyzed.Id, "Zweite", 1, 1, 1, 1));
            analyzed.LineItems.Add(new AnalyzedBillLineItem(analyzed.Id, "Erste", 2, 2, 1, 0));
            context.AnalyzedBill.Add(analyzed);
            context.SaveChanges();
            context.ChangeTracker.Clear();

            var handler = new GetAnalyzedBillsQueryHandler(context, Identity(UserA));
            var result = await handler.Handle(new GetAnalyzedBillsQuery(), CancellationToken.None);

            var dto = Assert.Single(Assert.IsType<Ok<List<AnalyzedBillDto>>>(result).Value!);
            Assert.Equal(["Erste", "Zweite"], dto.LineItems.Select(item => item.Description));
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
