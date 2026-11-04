using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.BillTemplate.CreateBillTemplate.V1;

internal class CreateBillTemplateCommandHandler : IRequestHandler<CreateBillTemplateCommand, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public CreateBillTemplateCommandHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(CreateBillTemplateCommand request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var lastSortOrder = await dbContext.BillTemplate
            .Where(template => template.UserId == userId)
            .MaxAsync(template => (int?)template.SortOrder, cancellationToken);

        var template = new Core.BillTemplate(
            userId,
            request.Name,
            request.ShopName,
            request.CategoryId,
            request.SubCategoryId,
            (lastSortOrder ?? -1) + 1);

        dbContext.BillTemplate.Add(template);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(BillTemplateDtoMapping.EntityToDto.Compile().Invoke(template));
    }
}
