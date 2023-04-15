using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.BillCategory.UpdateOrder.V1;

public record UpdateOrderCommand([property: FromBody] IReadOnlyCollection<CategoryOrderDto> Orders) : IHttpRequest;
