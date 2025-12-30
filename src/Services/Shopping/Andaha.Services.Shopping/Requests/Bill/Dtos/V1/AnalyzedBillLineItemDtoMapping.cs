using System.Linq.Expressions;

namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

internal static class AnalyzedBillLineItemDtoMapping
{
    public static Expression<
        Func<
            ICollection<Core.AnalyzedBillLineItem>,
            IReadOnlyCollection<AnalyzedBillLineItemDto>
        >
    > EntityToDto =
        (lineItems) => lineItems.Select(lineItem => new AnalyzedBillLineItemDto(
            lineItem.Description,
            lineItem.TotalPrice,
            lineItem.Quantity,
            lineItem.UnitPrice))
        .ToArray();
}
