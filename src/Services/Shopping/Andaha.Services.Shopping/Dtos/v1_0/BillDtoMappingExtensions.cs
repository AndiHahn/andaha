﻿using Andaha.Services.Shopping.Core;

namespace Andaha.Services.Shopping.Dtos.v1_0;

internal static class BillDtoMappingExtensions
{
    public static BillDto ToDto(this Bill bill)
        => new BillDto(bill.Id, bill.CreatedByUserId, bill.CategoryId, bill.ShopName, bill.Price, bill.Date, bill.Notes);
}