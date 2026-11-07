using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
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

        var rows = await dbContext.AnalyzedBill
            .AsNoTracking()
            .Include(b => b.LineItems)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.Date)
            .ThenByDescending(b => b.CreatedAt)
            .AsExpandable()
            .Select(bill => new
            {
                Dto = AnalyzedBillDtoMapping.EntityToDto.Invoke(bill),
                Stored = bill.NotCreatedReasons,
            })
            .ToListAsync(cancellationToken);

        var bills = rows
            .Select(row => row.Dto with { NotCreatedReasons = ResolveReasons(row.Dto, row.Stored) })
            .ToList();

        return Results.Ok(bills);
    }

    private static IReadOnlyCollection<string> ResolveReasons(
        AnalyzedBillDto dto,
        IReadOnlyList<NotCreatedReason>? stored)
    {
        var reasons = stored ?? AutoCreationRules.DeriveForLegacy(
            dto.ShopName,
            dto.Price,
            dto.Confidence,
            dto.TotalAmountConfidence,
            dto.LineItems.Sum(item => item.TotalPrice ?? 0),
            dto.CategoryId != null);

        return reasons.Select(reason => reason.ToString()).ToList();
    }
}