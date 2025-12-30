using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

internal static class BillLineItemDtoMapping
{
    public static Expression<
        Func<
            ICollection<Core.BillLineItem>,
            IReadOnlyCollection<BillLineItemDto>
        >
    > EntityToDto =
        (lineItems) => lineItems.Select(lineItem => new BillLineItemDto(
            lineItem.Description,
            lineItem.TotalPrice,
            lineItem.Quantity,
            lineItem.UnitPrice))
        .ToArray();
}
