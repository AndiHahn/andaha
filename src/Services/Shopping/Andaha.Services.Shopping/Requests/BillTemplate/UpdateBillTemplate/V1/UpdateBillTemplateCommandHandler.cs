using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplate.V1;

internal class UpdateBillTemplateCommandHandler : IRequestHandler<UpdateBillTemplateCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateBillTemplateCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(UpdateBillTemplateCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var template = await dbContext.BillTemplate
            .FirstOrDefaultAsync(t => t.UserId == userId && t.Id == request.Id, cancellationToken);

        if (template is null)
        {
            return Results.NotFound();
        }

        template.Update(request.Name, request.ShopName, request.CategoryId, request.SubCategoryId);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
