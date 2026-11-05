using LinqKit;
using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

internal static class BillDtoMapping
{
    /// <summary>
    /// Detail mapping (<c>GET api/bill/{id}</c>, create, update): with line items in display order.
    /// </summary>
    public static Expression<Func<Core.Bill, Guid, BillDto>> EntityToDto =
        (bill, currentUserId) => BillDtoMapping.ToDto.Invoke(
            bill,
            currentUserId,
            BillLineItemDtoMapping.EntityToDto.Invoke(bill.LineItems));

    /// <summary>
    /// List mapping (<c>GET api/bill/</c>): without line items (always an empty array) to keep the list lean.
    /// </summary>
    public static Expression<Func<Core.Bill, Guid, BillDto>> EntityToListDto =
        (bill, currentUserId) => BillDtoMapping.ToDto.Invoke(
            bill,
            currentUserId,
            Array.Empty<BillLineItemDto>());

    public static Expression<Func<Core.BillCategory, BillCategoryDto>> CategoryToDto =
        (category) => new BillCategoryDto(category.Id, category.Name, category.Color, category.Order);

    public static Expression<Func<Core.BillSubCategory?, BillSubCategoryDto?>> SubCategoryToDto =
        (category) => category == null ? null : new BillSubCategoryDto(category.Id, category.Name, category.Order);

    private static Expression<Func<Core.Bill, Guid, IReadOnlyCollection<BillLineItemDto>, BillDto>> ToDto =
        (bill, currentUserId, lineItems) => new BillDto(
            bill.Id,
            BillDtoMapping.CategoryToDto.Invoke(bill.Category),
            BillDtoMapping.SubCategoryToDto.Invoke(bill.SubCategory),
            bill.ShopName,
            bill.Price,
            bill.Date,
            bill.Notes,
            bill.UserId != currentUserId,
            bill.Images.Any(),
            bill.FromAutoAnalysis,
            lineItems,
            bill.CreatedAt);
}
