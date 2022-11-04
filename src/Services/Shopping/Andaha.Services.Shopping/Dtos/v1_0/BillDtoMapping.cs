using Andaha.Services.Shopping.Core;
using LinqKit;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Dtos.v1_0;

internal static class BillDtoMapping
{
    public static Expression<Func<Bill, Guid, BillDto>> EntityToDto =
        (bill, currentUserId) => new BillDto(
            bill.Id,
            BillCategoryDtoMapping.EntityToDto.Invoke(bill.Category),
            bill.ShopName,
            bill.Price,
            bill.Date,
            bill.Notes,
            bill.UserId != currentUserId,
            bill.Images.Any());
}
