using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplateOrder.V1;

internal class UpdateBillTemplateOrderCommandHandler : IRequestHandler<UpdateBillTemplateOrderCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateBillTemplateOrderCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(UpdateBillTemplateOrderCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var templates = await dbContext.BillTemplate
            .Where(template => template.UserId == userId)
            .ToListAsync(cancellationToken);

        for (var index = 0; index < request.Ids.Length; index++)
        {
            var template = templates.FirstOrDefault(t => t.Id == request.Ids[index]);

            if (template is null)
            {
                return Results.NotFound($"Template with id {request.Ids[index]} not found.");
            }

            template.UpdateSortOrder(index);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
