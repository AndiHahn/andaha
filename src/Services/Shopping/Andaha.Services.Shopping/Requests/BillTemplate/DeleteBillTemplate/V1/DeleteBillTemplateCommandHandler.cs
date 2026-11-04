using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.DeleteBillTemplate.V1;

internal class DeleteBillTemplateCommandHandler : IRequestHandler<DeleteBillTemplateCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public DeleteBillTemplateCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(DeleteBillTemplateCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var template = await dbContext.BillTemplate
            .FirstOrDefaultAsync(t => t.UserId == userId && t.Id == request.Id, cancellationToken);

        if (template is null)
        {
            return Results.NotFound();
        }

        dbContext.BillTemplate.Remove(template);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
