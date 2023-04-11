using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.BillCategory.UpdateBillCategory.V1;

public record UpdateBillCategoryCommand(Guid Id, [property: FromBody] CategoryUpdateDto Category) : IHttpRequest;
