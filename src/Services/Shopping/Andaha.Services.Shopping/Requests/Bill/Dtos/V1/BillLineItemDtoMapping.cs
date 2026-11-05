using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

internal static class BillLineItemDtoMapping
{
    /// <summary>
    /// Line items in display order (<see cref="Core.BillLineItem.Position"/>).
    /// </summary>
    public static Expression<
        Func<
            ICollection<Core.BillLineItem>,
            IReadOnlyCollection<BillLineItemDto>
        >
    > EntityToDto =
        (lineItems) => lineItems
            .OrderBy(lineItem => lineItem.Position)
            .ThenBy(lineItem => lineItem.Id)
            .Select(lineItem => new BillLineItemDto(
                lineItem.Id,
                lineItem.Description ?? string.Empty,
                lineItem.Quantity,
                lineItem.UnitPrice,
                lineItem.TotalPrice))
            .ToArray();
}
