using LinqKit;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

/// <remarks>
/// NotCreatedReasons is a placeholder here; the list handler fills it after materialisation.
/// </remarks>
internal static class AnalyzedBillDtoMapping
{
    public static Expression<Func<Core.AnalyzedBill, AnalyzedBillDto>> EntityToDto =
        static (bill) => new AnalyzedBillDto(
            bill.Id,
            bill.CategoryId,
            bill.SubCategoryId,
            bill.ShopName,
            bill.Price,
            bill.Date,
            AnalyzedBillLineItemDtoMapping.EntityToDto.Invoke(bill.LineItems),
            bill.Confidence,
            bill.TotalAmountConfidence,
            bill.Images.Any(),
            bill.SourceUploadId,
            Array.Empty<string>());
}