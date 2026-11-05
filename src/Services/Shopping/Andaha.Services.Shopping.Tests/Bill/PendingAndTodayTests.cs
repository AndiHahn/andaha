using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.GetAnalyzedBills.V1;
using Andaha.Services.Shopping.Requests.Bill.GetPendingAnalyses.V1;
using Andaha.Services.Shopping.Requests.Bill.GetTodayAutoCreatedBills.V1;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class PendingAndTodayTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    // 01:30 local time in Vienna (CET, UTC+1) on 2026-11-06; the UTC date is still the same day.
    private static readonly DateTimeOffset Now = new(2026, 11, 6, 0, 30, 0, TimeSpan.Zero);

    private static IIdentityService Identity(Guid user)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(user);
        return identity;
    }

    private static ImageMetadata Image(
        string name,
        Guid? userId,
        string? origin,
        DateTimeOffset? uploadedAt,
        DateTimeOffset? claimedUntil = null) => new()
    {
        ImageName = name,
        LastModified = Now,
        UserId = userId,
        Origin = origin,
        UploadedAtUtc = uploadedAt,
        ClaimedUntilUtc = claimedUntil,
        Attempts = claimedUntil is null ? 0 : 1,
    };

    [Fact]
    public async Task Pending_lists_only_own_app_uploads_with_state()
    {
        var repository = Substitute.For<IAnalysisImageRepository>();
        repository.ListImagesAsync(Arg.Any<CancellationToken>()).Returns(new[]
        {
            Image("analyzing.jpg", UserA, AnalysisUploadOptions.AppOrigin, Now.AddMinutes(-1), Now.AddMinutes(1)),
            Image("queued.jpg", UserA, AnalysisUploadOptions.AppOrigin, Now.AddMinutes(-5)),
            Image("claim-expired.jpg", UserA, AnalysisUploadOptions.AppOrigin, Now.AddMinutes(-3), Now.AddMinutes(-1)),
            Image("nas.jpg", UserA, AnalysisUploadOptions.NasOrigin, Now.AddMinutes(-4)),
            Image("other-user.jpg", UserB, AnalysisUploadOptions.AppOrigin, Now.AddMinutes(-2)),
            Image("legacy.jpg", UserA, null, null),
            Image("no-user.jpg", null, AnalysisUploadOptions.AppOrigin, Now.AddMinutes(-6)),
        });

        var handler = new GetPendingAnalysesQueryHandler(repository, Identity(UserA), new FixedTimeProvider(Now));

        var result = await handler.Handle(new GetPendingAnalysesQuery(), CancellationToken.None);

        var pending = Assert.IsType<Ok<PendingAnalysisDto[]>>(result).Value!;
        Assert.Equal(
            new[]
            {
                new PendingAnalysisDto("queued.jpg", Now.AddMinutes(-5), "queued"),
                new PendingAnalysisDto("claim-expired.jpg", Now.AddMinutes(-3), "queued"),
                new PendingAnalysisDto("analyzing.jpg", Now.AddMinutes(-1), "analyzing"),
            },
            pending);
    }

    [Fact]
    public async Task Today_returns_only_own_auto_created_bills_of_local_day()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var category = new BillCategory(UserA, "Food", "#111111", 0, Array.Empty<(string, int)>());
            var otherCategory = new BillCategory(UserB, "Food", "#111111", 0, Array.Empty<(string, int)>());
            context.BillCategory.AddRange(category, otherCategory);

            void AddBill(Guid user, Guid categoryId, string shop, bool auto, DateTime createdAtUtc)
            {
                var bill = new Core.Bill(
                    null, user, categoryId, null, shop, 10.5, new DateTime(2026, 11, 5), null, auto, sourceUploadId: shop + ".jpg");
                context.Bill.Add(bill);
                context.Entry(bill).Property(b => b.CreatedAt).CurrentValue = createdAtUtc;
            }

            // Vienna: 2026-11-06 starts at 2026-11-05T23:00Z.
            AddBill(UserA, category.Id, "early", true, new DateTime(2026, 11, 5, 23, 10, 0, DateTimeKind.Utc));
            AddBill(UserA, category.Id, "late", true, new DateTime(2026, 11, 6, 0, 20, 0, DateTimeKind.Utc));
            AddBill(UserA, category.Id, "yesterday", true, new DateTime(2026, 11, 5, 22, 50, 0, DateTimeKind.Utc));
            AddBill(UserA, category.Id, "manual", false, new DateTime(2026, 11, 6, 0, 0, 0, DateTimeKind.Utc));
            AddBill(UserB, otherCategory.Id, "other-user", true, new DateTime(2026, 11, 6, 0, 0, 0, DateTimeKind.Utc));
            context.SaveChanges();
            context.ChangeTracker.Clear();

            var handler = new GetTodayAutoCreatedBillsQueryHandler(context, Identity(UserA), new FixedTimeProvider(Now));

            // Without tz the day is the local day in Europe/Vienna.
            var vienna = Assert.IsType<Ok<AutoCreatedBillDto[]>>(
                await handler.Handle(new GetTodayAutoCreatedBillsQuery(), CancellationToken.None)).Value!;

            Assert.Equal(new[] { "late", "early" }, vienna.Select(bill => bill.ShopName));
            var late = vienna[0];
            Assert.Equal("late.jpg", late.SourceUploadId);
            Assert.Equal(10.5, late.Price);
            Assert.Equal(new DateTime(2026, 11, 5), late.Date);
            Assert.Equal(new DateTime(2026, 11, 6, 0, 20, 0, DateTimeKind.Utc), late.CreatedAt);
            Assert.Equal(DateTimeKind.Utc, late.CreatedAt.Kind);

            // In UTC, 2026-11-06 starts at midnight UTC.
            var utc = Assert.IsType<Ok<AutoCreatedBillDto[]>>(
                await handler.Handle(new GetTodayAutoCreatedBillsQuery("UTC"), CancellationToken.None)).Value!;

            Assert.Equal(new[] { "late" }, utc.Select(bill => bill.ShopName));
        }
    }

    [Fact]
    public async Task Today_rejects_unknown_tz()
    {
        var (context, connection) = TestDb.CreateShopping();
        context.Dispose();
        using (connection)
        {
            var builder = WebApplication.CreateBuilder();
            builder.AddCustomApplicationServices();
            builder.Services.AddScoped(_ => TestDb.Open(connection));
            builder.Services.AddSingleton(Identity(UserA));

            await using var app = builder.Build();
            using var scope = app.Services.CreateScope();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

            var result = await mediator.Send(new GetTodayAutoCreatedBillsQuery("Mars/Olympus_Mons"));

            var problem = Assert.IsType<ValidationProblem>(result);
            Assert.Equal(StatusCodes.Status400BadRequest, problem.StatusCode);
            Assert.Contains(nameof(GetTodayAutoCreatedBillsQuery.Tz), problem.ProblemDetails.Errors.Keys);
        }
    }

    [Fact]
    public async Task Analyzed_list_carries_source_upload_id()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            context.AnalyzedBill.Add(new AnalyzedBill(UserA, null, null, "Shop", 10, 0.5, 0.5, DateTime.UtcNow, "upload-1.jpg"));
            context.SaveChanges();
            context.ChangeTracker.Clear();

            var handler = new GetAnalyzedBillsQueryHandler(context, Identity(UserA));
            var result = await handler.Handle(new GetAnalyzedBillsQuery(), CancellationToken.None);

            var dto = Assert.Single(Assert.IsType<Ok<List<AnalyzedBillDto>>>(result).Value!);
            Assert.Equal("upload-1.jpg", dto.SourceUploadId);
        }
    }

    [Fact]
    public async Task Analyze_endpoint_is_gone()
    {
        var builder = WebApplication.CreateBuilder();
        builder.AddCustomApplicationServices();
        builder.AddCustomApiVersioning();

        await using var app = builder.Build();
        app.MapBillEndpoint();

        var routes = ((IEndpointRouteBuilder)app).DataSources
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .Select(endpoint => (
                Pattern: endpoint.RoutePattern.RawText!.Trim('/'),
                Methods: endpoint.Metadata.GetMetadata<IHttpMethodMetadata>()?.HttpMethods ?? Array.Empty<string>()))
            .ToList();

        Assert.DoesNotContain(routes, route => route.Pattern == "api/bill/analyze");
        Assert.Contains(routes, route => route.Pattern == "api/bill/analyzed/pending" && route.Methods.Contains("GET"));
        Assert.Contains(routes, route => route.Pattern == "api/bill/analyzed/today" && route.Methods.Contains("GET"));
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
