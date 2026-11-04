using Andaha.Services.Shopping.BackgroundJobs;
using Andaha.Services.Shopping.Contracts;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.Messaging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Andaha.Services.Shopping.Tests.BackgroundJobs;

public class AnalyzeBillWorkerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeAnalysisImageRepository repository = new();
    private readonly IMessageBroker broker = Substitute.For<IMessageBroker>();
    private readonly IFailedAnalysisImageHandler failedHandler = Substitute.For<IFailedAnalysisImageHandler>();
    private readonly MutableTimeProvider time = new(Now);

    private AnalyzeBillWorker CreateWorker(IAnalysisImageRepository? imageRepository = null)
    {
        var scopeFactory = new ServiceCollection()
            .AddScoped(_ => failedHandler)
            .BuildServiceProvider()
            .GetRequiredService<IServiceScopeFactory>();

        return new AnalyzeBillWorker(
            NullLogger<AnalyzeBillWorker>.Instance,
            imageRepository ?? repository,
            broker,
            scopeFactory,
            time);
    }

    [Fact]
    public async Task Skips_image_claimed_in_future()
    {
        repository.Add("a.jpg", attempts: 1, claimedUntilUtc: Now.AddMinutes(3));

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await broker.DidNotReceiveWithAnyArgs().PublishMessageAsync<AnalyzeBillMessageV1>(default!, default);
        await failedHandler.DidNotReceiveWithAnyArgs().HandleAsync(default!, default);
        Assert.Equal(1, repository.Get("a.jpg").Attempts);
    }

    [Fact]
    public async Task Claims_before_publishing()
    {
        var imageRepository = Substitute.For<IAnalysisImageRepository>();
        imageRepository.ListImagesAsync(Arg.Any<CancellationToken>()).Returns(
        [
            new ImageMetadata { ImageName = "a.jpg", LastModified = Now.AddHours(-1) },
        ]);

        await CreateWorker(imageRepository).PollAndProcessAsync(CancellationToken.None);

        Received.InOrder(() =>
        {
            imageRepository.ClaimAsync("a.jpg", Now + AnalyzeBillWorker.ClaimDuration, Arg.Any<CancellationToken>());
            broker.PublishMessageAsync(Arg.Is<AnalyzeBillMessageV1>(m => m.ImageName == "a.jpg"), Arg.Any<CancellationToken>());
        });
    }

    [Fact]
    public async Task Publish_failure_keeps_image_for_retry_after_claim_expires()
    {
        repository.Add("a.jpg");
        broker.PublishMessageAsync(Arg.Any<AnalyzeBillMessageV1>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("broker down"));
        var worker = CreateWorker();

        await worker.PollAndProcessAsync(CancellationToken.None);

        var claimed = repository.Get("a.jpg");
        Assert.Equal(1, claimed.Attempts);
        Assert.Equal(Now + AnalyzeBillWorker.ClaimDuration, claimed.ClaimedUntilUtc);

        time.Now = Now.AddMinutes(5);
        broker.ClearReceivedCalls();
        await worker.PollAndProcessAsync(CancellationToken.None);
        await broker.DidNotReceiveWithAnyArgs().PublishMessageAsync<AnalyzeBillMessageV1>(default!, default);

        time.Now = Now.AddMinutes(11);
        broker.ClearReceivedCalls();
        broker.PublishMessageAsync(Arg.Any<AnalyzeBillMessageV1>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        await worker.PollAndProcessAsync(CancellationToken.None);

        await broker.Received(1).PublishMessageAsync(Arg.Is<AnalyzeBillMessageV1>(m => m.ImageName == "a.jpg"), Arg.Any<CancellationToken>());
        Assert.Equal(2, repository.Get("a.jpg").Attempts);
        Assert.True(repository.Contains("a.jpg"));
        await failedHandler.DidNotReceiveWithAnyArgs().HandleAsync(default!, default);
    }

    [Fact]
    public async Task Image_with_three_attempts_becomes_empty_analyzed_bill_and_is_deleted()
    {
        repository.Add("a.jpg", attempts: AnalyzeBillWorker.MaxAttempts, claimedUntilUtc: Now.AddMinutes(-1));

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await failedHandler.Received(1).HandleAsync("a.jpg", Arg.Any<CancellationToken>());
        await broker.DidNotReceiveWithAnyArgs().PublishMessageAsync<AnalyzeBillMessageV1>(default!, default);
        Assert.Equal(AnalyzeBillWorker.MaxAttempts, repository.Get("a.jpg").Attempts);
    }

    [Fact]
    public async Task Third_attempt_still_in_flight_is_not_given_up()
    {
        repository.Add("a.jpg", attempts: AnalyzeBillWorker.MaxAttempts, claimedUntilUtc: Now.AddMinutes(9));

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await failedHandler.DidNotReceiveWithAnyArgs().HandleAsync(default!, default);
        await broker.DidNotReceiveWithAnyArgs().PublishMessageAsync<AnalyzeBillMessageV1>(default!, default);
    }

    [Fact]
    public async Task Legacy_processed_image_becomes_empty_analyzed_bill()
    {
        repository.Add("legacy.jpg", legacyProcessed: true);
        repository.Add("fresh.jpg");

        await CreateWorker().PollAndProcessAsync(CancellationToken.None);

        await failedHandler.Received(1).HandleAsync("legacy.jpg", Arg.Any<CancellationToken>());
        await failedHandler.DidNotReceive().HandleAsync("fresh.jpg", Arg.Any<CancellationToken>());
        await broker.Received(1).PublishMessageAsync(Arg.Is<AnalyzeBillMessageV1>(m => m.ImageName == "fresh.jpg"), Arg.Any<CancellationToken>());
        await broker.DidNotReceive().PublishMessageAsync(Arg.Is<AnalyzeBillMessageV1>(m => m.ImageName == "legacy.jpg"), Arg.Any<CancellationToken>());
    }

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

        public Task DeleteImageAsync(string name, CancellationToken ct = default)
        {
            images.Remove(name);
            return Task.CompletedTask;
        }

        public Task<(Stream Image, Guid UserId)> GetImageAsync(string name, CancellationToken ct = default)
            => throw new NotSupportedException();

        public Task UploadImageAsync(string name, Stream imageStream, Guid userId, CancellationToken ct = default)
            => throw new NotSupportedException();
    }
}
