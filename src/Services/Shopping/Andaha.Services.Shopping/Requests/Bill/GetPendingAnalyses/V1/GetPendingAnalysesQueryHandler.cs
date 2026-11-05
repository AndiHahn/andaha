using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using MediatR;

namespace Andaha.Services.Shopping.Requests.Bill.GetPendingAnalyses.V1;

/// <summary>
/// Images of the current user that were uploaded through the app and are still in the analysis store.
/// NAS images (<c>origin=nas</c>) are not listed.
/// </summary>
internal class GetPendingAnalysesQueryHandler(
    IAnalysisImageRepository analysisImageRepository,
    IIdentityService identityService,
    TimeProvider timeProvider) : IRequestHandler<GetPendingAnalysesQuery, IResult>
{
    public async Task<IResult> Handle(GetPendingAnalysesQuery request, CancellationToken cancellationToken)
    {
        var userId = identityService.GetUserId();
        var now = timeProvider.GetUtcNow();

        var images = await analysisImageRepository.ListImagesAsync(cancellationToken);

        var pending = images
            .Where(image => image.UserId == userId && image.Origin == AnalysisUploadOptions.AppOrigin)
            .Select(image => new PendingAnalysisDto(
                image.ImageName,
                image.UploadedAtUtc ?? image.LastModified,
                image.ClaimedUntilUtc > now ? PendingAnalysisDto.Analyzing : PendingAnalysisDto.Queued))
            .OrderBy(image => image.UploadedAt)
            .ToArray();

        return Results.Ok(pending);
    }
}
