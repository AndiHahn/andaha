using Andaha.Services.Shopping.BackgroundJobs;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Requests.Bill.AnalyzeBill;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Andaha.Services.Shopping.Tests.BackgroundJobs;

public class AnalyzeBillWorkerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeAnalysisImageRepository repository = new();
    private readonly IBillAnalysisProcessor processor = Substitute.For<IBillAnalysisProcessor>();
    private readonly IFailedAnalysisImageHandler failedHandler = Substitute.For<IFailedAnalysisImageHandler>();
    private readonly MutableTimeProvider time = new(Now);

    private AnalyzeBillWorker CreateWorker(IAnalysisImageRepository? imageRepository = null)
    {
        var scopeFactory = new ServiceCollection()
            .AddScoped(_ => failedHandler)
            .AddScoped(_ => processor)
            .BuildServiceProvider()
            .GetRequiredService<IServiceScopeFactory>();

        return new AnalyzeBillWorker(
            NullLogger<AnalyzeBillWorker>.Instance,
            imageRepository ?? repository,
            scopeFactory,
            time);
    }

    [Fact]
    public async Task Skips_image_claimed_in_future()
    {
        repository.Add("a.jpg", attempts: 1, claimedUntilUtc: Now.AddMinutes(3));

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await processor.DidNotReceiveWithAnyArgs().ProcessAsync(default!, default);
        await failedHandler.DidNotReceiveWithAnyArgs().HandleAsync(default!, default);
        Assert.Equal(1, repository.Get("a.jpg").Attempts);
    }

    [Fact]
    public async Task Claims_before_processing()
    {
        var imageRepository = Substitute.For<IAnalysisImageRepository>();
        var image = new ImageMetadata { ImageName = "a.jpg", LastModified = Now.AddHours(-1) };
        imageRepository.ListImagesAsync(Arg.Any<CancellationToken>()).Returns([image]);
        imageRepository.GetMetadataAsync("a.jpg", Arg.Any<CancellationToken>()).Returns(image);

        await CreateWorker(imageRepository).PollAndProcessAsync(CancellationToken.None);

        Received.InOrder(() =>
        {
            imageRepository.ClaimAsync("a.jpg", Now + AnalyzeBillWorker.ClaimDuration, Arg.Any<CancellationToken>());
            processor.ProcessAsync("a.jpg", Arg.Any<CancellationToken>());
        });
        await imageRepository.DidNotReceiveWithAnyArgs().ReleaseClaimAsync(default!, default);
    }

    [Fact]
    public async Task Processing_failure_releases_claim_for_retry_on_next_run()
    {
        repository.Add("a.jpg");
        processor.ProcessAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("analysis down"));
        var worker = CreateWorker();

        await worker.PollAndProcessAsync(CancellationToken.None);

        var released = repository.Get("a.jpg");
        Assert.Equal(1, released.Attempts);
        Assert.Null(released.ClaimedUntilUtc);

        time.Now = Now.AddMinutes(1);
        processor.ClearReceivedCalls();
        processor.ProcessAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        await worker.PollAndProcessAsync(CancellationToken.None);

        await processor.Received(1).ProcessAsync("a.jpg", Arg.Any<CancellationToken>());
        Assert.Equal(2, repository.Get("a.jpg").Attempts);
        Assert.True(repository.Contains("a.jpg"));
        await failedHandler.DidNotReceiveWithAnyArgs().HandleAsync(default!, default);
    }

    [Fact]
    public async Task Worker_skips_image_claimed_by_upload()
    {
        await repository.UploadImageAsync("upload", new MemoryStream([1]), Guid.NewGuid(), UploadClaim());
        time.Now = Now.AddMinutes(1);

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await processor.DidNotReceiveWithAnyArgs().ProcessAsync(default!, default);
        await failedHandler.DidNotReceiveWithAnyArgs().HandleAsync(default!, default);
        var image = repository.Get("upload");
        Assert.Equal(1, image.Attempts);
        Assert.Equal(Now.AddMinutes(2), image.ClaimedUntilUtc);
    }

    [Fact]
    public async Task Worker_processes_after_claim_released()
    {
        await repository.UploadImageAsync("upload", new MemoryStream([1]), Guid.NewGuid(), UploadClaim());
        await repository.ReleaseClaimAsync("upload");
        time.Now = Now.AddMinutes(1);

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await processor.Received(1).ProcessAsync("upload", Arg.Any<CancellationToken>());
        var image = repository.Get("upload");
        Assert.Equal(2, image.Attempts);
        Assert.Equal(time.Now + AnalyzeBillWorker.ClaimDuration, image.ClaimedUntilUtc);
    }

    [Fact]
    public async Task Worker_rechecks_claim_before_processing_stale_snapshot_entry()
    {
        // The listing at the start of the run still shows both images unclaimed ...
        var imageRepository = Substitute.For<IAnalysisImageRepository>();
        imageRepository.ListImagesAsync(Arg.Any<CancellationToken>()).Returns(
        [
            new ImageMetadata { ImageName = "claimed.jpg", LastModified = Now.AddHours(-1) },
            new ImageMetadata { ImageName = "gone.jpg", LastModified = Now.AddHours(-1), Attempts = AnalyzeBillWorker.MaxAttempts },
        ]);
        // ... but meanwhile the immediate analysis claimed one and finished the other.
        imageRepository.GetMetadataAsync("claimed.jpg", Arg.Any<CancellationToken>()).Returns(new ImageMetadata
        {
            ImageName = "claimed.jpg",
            LastModified = Now.AddHours(-1),
            Attempts = 1,
            ClaimedUntilUtc = Now + AnalyzeBillWorker.ClaimDuration,
        });
        imageRepository.GetMetadataAsync("gone.jpg", Arg.Any<CancellationToken>()).Returns((ImageMetadata?)null);

        await CreateWorker(imageRepository).PollAndProcessAsync(CancellationToken.None);

        await imageRepository.DidNotReceiveWithAnyArgs().ClaimAsync(default!, default, default);
        await processor.DidNotReceiveWithAnyArgs().ProcessAsync(default!, default);
        await failedHandler.DidNotReceiveWithAnyArgs().HandleAsync(default!, default);
    }

    [Fact]
    public async Task Image_with_three_attempts_becomes_empty_analyzed_bill_and_is_deleted()
    {
        repository.Add("a.jpg", attempts: AnalyzeBillWorker.MaxAttempts, claimedUntilUtc: Now.AddMinutes(-1));

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await failedHandler.Received(1).HandleAsync("a.jpg", Arg.Any<CancellationToken>());
        await processor.DidNotReceiveWithAnyArgs().ProcessAsync(default!, default);
        Assert.Equal(AnalyzeBillWorker.MaxAttempts, repository.Get("a.jpg").Attempts);
    }

    [Fact]
    public async Task Third_attempt_still_in_flight_is_not_given_up()
    {
        repository.Add("a.jpg", attempts: AnalyzeBillWorker.MaxAttempts, claimedUntilUtc: Now.AddMinutes(9));

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await failedHandler.DidNotReceiveWithAnyArgs().HandleAsync(default!, default);
        await processor.DidNotReceiveWithAnyArgs().ProcessAsync(default!, default);
    }

    [Fact]
    public async Task Legacy_processed_image_becomes_empty_analyzed_bill()
    {
        repository.Add("legacy.jpg", legacyProcessed: true);
        repository.Add("fresh.jpg");

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await failedHandler.Received(1).HandleAsync("legacy.jpg", Arg.Any<CancellationToken>());
        await failedHandler.DidNotReceive().HandleAsync("fresh.jpg", Arg.Any<CancellationToken>());
        await processor.Received(1).ProcessAsync("fresh.jpg", Arg.Any<CancellationToken>());
        await processor.DidNotReceive().ProcessAsync("legacy.jpg", Arg.Any<CancellationToken>());
    }

    private static AnalysisUploadOptions UploadClaim()
        => new()
        {
            UploadedAtUtc = Now,
            Origin = AnalysisUploadOptions.AppOrigin,
            ClaimedUntilUtc = Now.AddMinutes(2),
            Attempts = 1,
        };

    private sealed class MutableTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = now;

        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class FakeAnalysisImageRepository : IAnalysisImageRepository
    {
        private readonly Dictionary<string, ImageMetadata> images = [];

        public void Add(string name, int attempts = 0, DateTimeOffset? claimedUntilUtc = null, bool legacyProcessed = false)
            => images[name] = new ImageMetadata
            {
                ImageName = name,
                LastModified = Now.AddHours(-1).AddSeconds(images.Count),
                Attempts = attempts,
                ClaimedUntilUtc = claimedUntilUtc,
                LegacyProcessed = legacyProcessed,
            };

        public ImageMetadata Get(string name) => images[name];

        public bool Contains(string name) => images.ContainsKey(name);

        public Task<IReadOnlyCollection<ImageMetadata>> ListImagesAsync(CancellationToken ct = default)
            => Task.FromResult<IReadOnlyCollection<ImageMetadata>>(images.Values.Select(image => image with { }).ToList());

        public Task ClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default)
        {
            var image = images[name];
            images[name] = image with { Attempts = image.Attempts + 1, ClaimedUntilUtc = claimedUntilUtc };
            return Task.CompletedTask;
        }

        public Task<ImageMetadata?> GetMetadataAsync(string name, CancellationToken ct = default)
            => Task.FromResult(images.TryGetValue(name, out var image) ? image with { } : null);

        public Task ExtendClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct = default)
        {
            images[name] = images[name] with { ClaimedUntilUtc = claimedUntilUtc };
            return Task.CompletedTask;
        }

        public Task ReleaseClaimAsync(string name, CancellationToken ct = default)
        {
            images[name] = images[name] with { ClaimedUntilUtc = null };
            return Task.CompletedTask;
        }

        public Task DeleteImageAsync(string name, CancellationToken ct = default)
        {
            images.Remove(name);
            return Task.CompletedTask;
        }

        public Task<(Stream Image, Guid UserId)> GetImageAsync(string name, CancellationToken ct = default)
            => throw new NotSupportedException();

        public Task UploadImageAsync(string name, Stream imageStream, Guid userId, AnalysisUploadOptions options, CancellationToken ct = default)
        {
            images[name] = new ImageMetadata
            {
                ImageName = name,
                LastModified = options.UploadedAtUtc,
                UserId = userId,
                UploadedAtUtc = options.UploadedAtUtc,
                Origin = options.Origin,
                Attempts = options.Attempts,
                ClaimedUntilUtc = options.ClaimedUntilUtc,
            };
            return Task.CompletedTask;
        }
    }
}
