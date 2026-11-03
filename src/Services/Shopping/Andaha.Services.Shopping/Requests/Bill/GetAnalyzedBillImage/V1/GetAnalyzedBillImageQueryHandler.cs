using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.GetAnalyzedBillImage.V1;

internal class GetAnalyzedBillImageQueryHandler(
    ShoppingDbContext dbContext,
    IIdentityService identityService,
    IImageRepository imageRepository) : IRequestHandler<GetAnalyzedBillImageQuery, IResult>
{
    public async Task<IResult> Handle(GetAnalyzedBillImageQuery request, CancellationToken cancellationToken)
    {
        var analyzedBill = await dbContext.AnalyzedBill
            .AsNoTracking()
            .Include(b => b.Images)
            .FirstOrDefaultAsync(b => b.Id == request.Id, cancellationToken);
        if (analyzedBill is null || !analyzedBill.Images.Any())
        {
            return Results.NotFound($"No image available for analyzed bill {request.Id}.");
        }

        // Analyzed bills are private to their creator (no collaboration sharing).
        if (analyzedBill.UserId != identityService.GetUserId())
        {
            return Results.Forbid();
        }

        var imageStream = await imageRepository.GetImageStreamAsync(analyzedBill.Images.First().Name, cancellationToken);
        if (imageStream is null)
        {
            return Results.NotFound($"No image available for analyzed bill {request.Id}.");
        }

        using (imageStream)
        {
            using MemoryStream ms = new();
            await imageStream.CopyToAsync(ms, cancellationToken);
            return Results.File(ms.ToArray(), "image/png");
        }
    }
}
