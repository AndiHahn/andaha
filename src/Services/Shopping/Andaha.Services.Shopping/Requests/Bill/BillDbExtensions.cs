using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using LinqKit;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill;

internal static class BillDbExtensions
{
    /// <summary>
    /// The bill as DTO, or <c>null</c> when it no longer exists (e.g. deleted between the caller's check and this read).
    /// </summary>
    public static Task<BillDto?> FindBillDtoByIdAsync(
        this ShoppingDbContext dbContext,
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken)
        => dbContext.Bill.AsNoTracking()
            .Where(billDb => billDb.Id == id)
            .AsExpandable()
            .Select(bill => BillDtoMapping.EntityToDto.Invoke(bill, currentUserId))
            .SingleOrDefaultAsync(cancellationToken);


    /// <summary>
    /// The analysis image <paramref name="sourceUploadId"/> was already turned into a bill or analyzed bill
    /// (an earlier attempt saved its result but did not delete the image, or a retried upload came after the result).
    /// </summary>
    public static async Task<bool> IsAnalysisUploadProcessedAsync(
        this ShoppingDbContext dbContext,
        string sourceUploadId,
        CancellationToken cancellationToken)
        => await dbContext.Bill.AnyAsync(bill => bill.SourceUploadId == sourceUploadId, cancellationToken) ||
           await dbContext.AnalyzedBill.AnyAsync(analyzedBill => analyzedBill.SourceUploadId == sourceUploadId, cancellationToken);
}
