using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.BillCategory.CreateBillCategory.V1;

public record CreateBillCategoryCommand([property: FromBody] CategoryUpdateDto Category) : IHttpRequest;
