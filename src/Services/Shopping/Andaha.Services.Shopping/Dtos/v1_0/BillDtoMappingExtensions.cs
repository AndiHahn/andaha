using Andaha.Services.Shopping.Core;

namespace Andaha.Services.Shopping.Dtos.v1_0;

internal static class BillDtoMappingExtensions
{
    public static BillDto ToDto(this Bill bill)
        => new BillDto(
            bill.Id,
            bill.UserId,
            new BillCategoryDto(bill.Category.Id, bill.Category.Name, bill.Category.Color),
            bill.ShopName,
            bill.Price,
            bill.Date,
            bill.Notes);
}
