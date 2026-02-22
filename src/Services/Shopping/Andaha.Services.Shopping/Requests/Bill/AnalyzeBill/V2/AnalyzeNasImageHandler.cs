using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Nas;
using MediatR;

namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V2;

public class AnalyzeNasImageHandler(
    INasImageRepository repository,
    IIdentityService identityService) : IRequestHandler<AnalyzeNasImage, IResult>
{
    public async Task<IResult> Handle(AnalyzeNasImage request, CancellationToken cancellationToken)
    {
        var randomFileName = Guid.NewGuid().ToString() + ".jpg";

        using var stream = request.BillImage.OpenReadStream();

        Guid userId = identityService.GetUserId();

        await repository.UploadImageAsync(randomFileName, userId, stream, cancellationToken);

        return Results.NoContent();
    }
}
