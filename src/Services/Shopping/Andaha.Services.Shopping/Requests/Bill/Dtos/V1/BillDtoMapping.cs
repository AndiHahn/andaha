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
            BillLineItemDtoMapping.EntityToDto.Invoke(bill.LineItems),
            null);

    /// <summary>
    /// List mapping (<c>GET api/bill/</c>): without line items (always an empty array) to keep the list lean.
    /// </summary>
    public static Expression<Func<Core.Bill, Guid, BillDto>> EntityToListDto =
        (bill, currentUserId) => BillDtoMapping.ToDto.Invoke(
            bill,
            currentUserId,
            Array.Empty<BillLineItemDto>(),
            null);

    /// <summary>
    /// List mapping with an active search term: like <see cref="EntityToListDto"/>, plus the first line item
    /// (by position) whose description contains <c>search</c>, or <c>null</c> if only shop or notes match.
    /// </summary>
    public static Expression<Func<Core.Bill, Guid, string, BillDto>> EntityToSearchListDto =
        (bill, currentUserId, search) => BillDtoMapping.ToDto.Invoke(
            bill,
            currentUserId,
            Array.Empty<BillLineItemDto>(),
            bill.LineItems
                .Where(lineItem => lineItem.Description != null && lineItem.Description.Contains(search))
                .OrderBy(lineItem => lineItem.Position)
                .Select(lineItem => new MatchedLineItemDto(lineItem.Description!, lineItem.TotalPrice))
                .FirstOrDefault());

    public static Expression<Func<Core.BillCategory, BillCategoryDto>> CategoryToDto =
        (category) => new BillCategoryDto(category.Id, category.Name, category.Color, category.Order);

    public static Expression<Func<Core.BillSubCategory?, BillSubCategoryDto?>> SubCategoryToDto =
        (category) => category == null ? null : new BillSubCategoryDto(category.Id, category.Name, category.Order);

    private static Expression<Func<Core.Bill, Guid, IReadOnlyCollection<BillLineItemDto>, MatchedLineItemDto?, BillDto>> ToDto =
        (bill, currentUserId, lineItems, matchedLineItem) => new BillDto(
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
            bill.CreatedAt,
            matchedLineItem,
            bill.Confidence,
            bill.TotalAmountConfidence,
            bill.ShopNameConfidence,
            bill.DateConfidence,
            bill.TotalAmountText);
}
