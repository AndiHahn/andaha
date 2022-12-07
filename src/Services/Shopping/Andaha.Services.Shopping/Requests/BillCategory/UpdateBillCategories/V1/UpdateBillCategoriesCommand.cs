using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.BillCategory.UpdateBillCategories.V1;

public record UpdateBillCategoriesCommand([FromBody] IReadOnlyCollection<BillCategoryUpdateDto> Categories) : IHttpRequest;
