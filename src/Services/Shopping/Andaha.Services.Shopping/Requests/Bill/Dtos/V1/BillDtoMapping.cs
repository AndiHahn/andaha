using LinqKit;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

internal static class BillDtoMapping
{
    public static Expression<Func<Core.Bill, Guid, BillDto>> EntityToDto =
        (bill, currentUserId) => new BillDto(
            bill.Id,
            BillDtoMapping.CategoryToDto.Invoke(bill.Category),
            BillDtoMapping.SubCategoryToDto.Invoke(bill.SubCategory),
            bill.ShopName,
            bill.Price,
            bill.Date,
            bill.Notes,
            bill.UserId != currentUserId,
            bill.Images.Any());

    public static Expression<Func<Core.BillCategory, BillCategoryDto>> CategoryToDto =
        (category) => new BillCategoryDto(category.Id, category.Name, category.Color);

    public static Expression<Func<Core.BillSubCategory?, BillSubCategoryDto?>> SubCategoryToDto =
        (category) => category == null ? null : new BillSubCategoryDto(category.Id, category.Name);
}
