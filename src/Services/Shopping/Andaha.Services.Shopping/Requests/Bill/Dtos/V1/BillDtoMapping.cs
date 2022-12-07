using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;
using LinqKit;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

internal static class BillDtoMapping
{
    public static Expression<Func<Core.Bill, Guid, BillDto>> EntityToDto =
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
