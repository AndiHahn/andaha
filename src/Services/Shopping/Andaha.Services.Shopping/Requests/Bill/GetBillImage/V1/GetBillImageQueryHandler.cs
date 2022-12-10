using Andaha.Services.Shopping.Infrastructure.ImageRepository;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Andaha.CrossCutting.Application.Identity;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.GetBillImage.V1;

internal class GetBillImageQueryHandler : IRequestHandler<GetBillImageQuery, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;
    private readonly IImageRepository imageRepository;

    public GetBillImageQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy,
        IImageRepository imageRepository)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
        this.imageRepository = imageRepository ?? throw new ArgumentNullException(nameof(imageRepository));
    }

    public async Task<IResult> Handle(GetBillImageQuery request, CancellationToken cancellationToken)
    {
        var bill = await dbContext.Bill
            .AsNoTracking()
            .Include(bill => bill.Images)
            .FirstOrDefaultAsync(bill => bill.Id == request.Id, cancellationToken);
        if (bill is null || !bill.Images.Any())
        {
            return Results.NotFound($"No image available for bill {request.Id}.");
        }

        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);
        if (!bill.HasCreated(userId) && !connectedUsers.Contains(userId))
        {
            return Results.Forbid();
        }

        var imageName = bill.Images.First().Name;

        var imageStream = await imageRepository.GetImageStreamAsync(imageName, cancellationToken);
        if (imageStream is null)
        {
            return Results.NotFound($"No image available for bill {request.Id}");
        }

        return Results.File(ReadStreamToBytes(imageStream), "image/png");
    }

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
