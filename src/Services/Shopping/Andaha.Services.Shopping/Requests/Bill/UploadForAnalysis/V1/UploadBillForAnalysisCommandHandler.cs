using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;

// The AnalyzeBillWorker polls the analysis repository and publishes the analysis message itself,
// so this handler must not publish (it would be analyzed twice).
internal class UploadBillForAnalysisCommandHandler(
    IAnalysisImageRepository analysisImageRepository,
    IIdentityService identityService) : IRequestHandler<UploadBillForAnalysisCommand, IResult>
{
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

        using Stream imageStream = file.OpenReadStream();

        await analysisImageRepository.UploadImageAsync(imageName, imageStream, userId, cancellationToken);

        return Results.Accepted();
    }
}
