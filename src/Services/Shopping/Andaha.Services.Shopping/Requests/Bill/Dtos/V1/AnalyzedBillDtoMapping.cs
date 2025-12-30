using LinqKit;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

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
            AnalyzedBillLineItemDtoMapping.EntityToDto.Invoke(bill.LineItems));
}