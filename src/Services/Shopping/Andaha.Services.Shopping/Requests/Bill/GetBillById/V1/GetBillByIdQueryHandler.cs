using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.GetBillById.V1;

internal class GetBillByIdQueryHandler : IRequestHandler<GetBillByIdQuery, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetBillByIdQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetBillByIdQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        // Own bills and bills of connected users (detail page, US-0009 §5.3); a bill of an unconnected user behaves
        // like a missing one.
        bool isVisible = await dbContext.Bill
            .AnyAsync(
                bill => bill.Id == request.Id &&
                        (bill.UserId == userId || connectedUsers.Contains(bill.UserId)),
                cancellationToken);

        if (!isVisible)
        {
            return Results.NotFound($"Bill with id {request.Id} not found.");
        }

        // deleted between the check and this read: still a missing bill, not a server error
        var bill = await dbContext.FindBillDtoByIdAsync(request.Id, userId, cancellationToken);

        return bill is null
            ? Results.NotFound($"Bill with id {request.Id} not found.")
            : Results.Ok(bill);
    }
}
