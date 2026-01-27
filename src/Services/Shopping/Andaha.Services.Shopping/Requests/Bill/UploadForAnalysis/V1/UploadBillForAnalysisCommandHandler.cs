using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Contracts;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.Messaging;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;

internal class UploadBillForAnalysisCommandHandler(
    IImageRepository imageRepository,
    IIdentityService identityService,
    IMessageBroker messageBroker) : IRequestHandler<UploadBillForAnalysisCommand, IResult>
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

        var id = Guid.NewGuid();

        await UploadImageAsync(id, request.File, cancellationToken);

        var message = new AnalyzeBillMessageV1
        {
            ImageName = id.ToString(),
            LastModifiedUtc = DateTimeOffset.UtcNow
        };

        await messageBroker.PublishMessageAsync(message, cancellationToken);

        return Results.Accepted();
    }

    private async Task UploadImageAsync(Guid id, IFormFile file, CancellationToken ct)
    {
        string imageName = GetImageName(id);
        
        var userId = identityService.GetUserId();

        using Stream imageStream = file.OpenReadStream();

        await imageRepository.UploadImageAsync(imageName, imageStream, ct);
    }

    private static string GetImageName(Guid id) => id.ToString();

}