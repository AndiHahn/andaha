using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.BackgroundJobs;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;

// Stores the image with an active claim and hands it to the ImmediateAnalysisService (US-0009).
// The AnalyzeBillWorker skips the claimed image and only steps in after a failure or a restart.
internal class UploadBillForAnalysisCommandHandler(
    IAnalysisImageRepository analysisImageRepository,
    IIdentityService identityService,
    AnalysisQueue analysisQueue,
    TimeProvider timeProvider) : IRequestHandler<UploadBillForAnalysisCommand, IResult>
{
    /// <summary>
    /// Long enough for the immediate analysis, short enough that the worker takes over soon after a restart.
    /// </summary>
    internal static readonly TimeSpan UploadClaimDuration = TimeSpan.FromMinutes(2);

    public async Task<IResult> Handle(UploadBillForAnalysisCommand request, CancellationToken cancellationToken)
    {
        var file = request.File;
        if (file is null || file.Length == 0)
        {
            return Results.BadRequest(new ProblemDetails 
            { 
                Title = "No file uploaded", 
                Detail = "Please provide a file as multipart/form-data with field name 'file'." 
            });
        }

        var imageName = Guid.NewGuid().ToString();
        var userId = identityService.GetUserId();
        var now = timeProvider.GetUtcNow();

        // Claim and attempt are written with the upload itself, so the worker never sees the image unclaimed.
        var options = new AnalysisUploadOptions
        {
            UploadedAtUtc = now,
            Origin = AnalysisUploadOptions.AppOrigin,
            ClaimedUntilUtc = now + UploadClaimDuration,
            Attempts = 1,
        };

        using (Stream imageStream = file.OpenReadStream())
        {
            await analysisImageRepository.UploadImageAsync(imageName, imageStream, userId, options, cancellationToken);
        }

        analysisQueue.Enqueue(imageName);

        return Results.Accepted(value: new UploadBillForAnalysisResponse(imageName));
    }
}
