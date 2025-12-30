using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.GetAnalyzedBills.V1;

internal class GetAnalyzedBillsQueryHandler : IRequestHandler<GetAnalyzedBillsQuery, IResult>
{
    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;

    public GetAnalyzedBillsQueryHandler(ShoppingDbContext dbContext, IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(GetAnalyzedBillsQuery request, CancellationToken cancellationToken)
    {
        var userId = identityService.GetUserId();

        var bills = await dbContext.AnalyzedBill
            .AsNoTracking()
            .Include(b => b.LineItems)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.Date)
            .ThenByDescending(b => b.CreatedAt)
            .AsExpandable()
            .Select(bill => AnalyzedBillDtoMapping.EntityToDto.Invoke(bill))
            .ToListAsync(cancellationToken);

        return Results.Ok(bills);
    }
}