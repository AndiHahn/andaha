using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Common;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.GetTodayAutoCreatedBills.V1;

/// <summary>
/// Own bills the analysis created automatically on the current local day, newest first.
/// </summary>
internal class GetTodayAutoCreatedBillsQueryHandler(
    ShoppingDbContext dbContext,
    IIdentityService identityService,
    TimeProvider timeProvider) : IRequestHandler<GetTodayAutoCreatedBillsQuery, IResult>
{
    public async Task<IResult> Handle(GetTodayAutoCreatedBillsQuery request, CancellationToken cancellationToken)
    {
        var userId = identityService.GetUserId();
        var (startUtc, endUtc) = LocalDays.DayOf(timeProvider.GetUtcNow(), LocalDays.ResolveTimeZone(request.Tz));

        var bills = await dbContext.Bill
            .AsNoTracking()
            .Where(bill => bill.UserId == userId &&
                           bill.FromAutoAnalysis &&
                           bill.CreatedAt >= startUtc &&
                           bill.CreatedAt < endUtc)
            .OrderByDescending(bill => bill.CreatedAt)
            .Select(bill => new AutoCreatedBillDto(
                bill.Id,
                bill.SourceUploadId,
                bill.ShopName,
                bill.Price,
                bill.Date,
                bill.CreatedAt))
            .ToArrayAsync(cancellationToken);

        return Results.Ok(bills);
    }
}
