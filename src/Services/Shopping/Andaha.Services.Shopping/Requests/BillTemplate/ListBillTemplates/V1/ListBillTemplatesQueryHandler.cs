using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.ListBillTemplates.V1;

internal class ListBillTemplatesQueryHandler : IRequestHandler<ListBillTemplatesQuery, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public ListBillTemplatesQueryHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(ListBillTemplatesQuery request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var templates = await dbContext.BillTemplate
            .AsNoTracking()
            .Where(template => template.UserId == userId)
            .OrderBy(template => template.SortOrder)
            .Select(BillTemplateDtoMapping.EntityToDto)
            .ToArrayAsync(cancellationToken);

        return Results.Ok(templates);
    }
}
