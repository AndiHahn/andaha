using Andaha.Services.Shopping.Infrastructure.ImageRepository;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Andaha.CrossCutting.Application.Identity;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Models;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Bill.Queries.GetBillImage;

internal class GetBillImageQueryHandler : IRequestHandler<GetBillImageQuery, Result<BillImageModel>>
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

    public async Task<Result<BillImageModel>> Handle(GetBillImageQuery request, CancellationToken cancellationToken)
    {
        var bill = await this.dbContext.Bill
            .AsNoTracking()
            .Include(bill => bill.Images)
            .FirstOrDefaultAsync(bill => bill.Id == request.BillId, cancellationToken);
        if (bill is null || !bill.Images.Any())
        {
            return Result<BillImageModel>.NotFound($"No image available for bill {request.BillId}.");
        }

        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);
        if (!bill.HasCreated(userId) && !connectedUsers.Contains(userId))
        {
            return Result<BillImageModel>.Forbidden("User has no access to bill.");
        }

        var imageName = bill.Images.First().Name;

        var image = await this.imageRepository.GetImageAsync(imageName, cancellationToken);
        if (image is null)
        {
            return Result<BillImageModel>.NotFound($"No image available for bill {request.BillId}");
        }

        return new BillImageModel(new MemoryStream(image), "image/png", DateTime.UtcNow);
    }
}
