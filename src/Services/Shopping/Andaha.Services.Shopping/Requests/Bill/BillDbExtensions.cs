using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using LinqKit;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill;

internal static class BillDbExtensions
{
    public static Task<BillDto> FindBillDtoByIdAsync(
        this ShoppingDbContext dbContext,
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken)
        => dbContext.Bill.AsNoTracking()
            .Where(billDb => billDb.Id == id &&
                             billDb.UserId == currentUserId)
            .AsExpandable()
            .Select(bill => BillDtoMapping.EntityToDto.Invoke(bill, currentUserId))
            .SingleAsync(cancellationToken);
}
