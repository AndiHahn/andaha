using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Application.Queries.ListBillCategories;
using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Controllers.v1_0;
[MapToProblemDetails]
[Authorize]
[Consumes("application/json")]
[Produces("application/json")]
[ApiVersion("1.0")]
[Route("api/[controller]")]
[ApiController]
public class BillCategoryController : ControllerBase
{
    private readonly ISender sender;

    public BillCategoryController(ISender sender)
    {
        this.sender = sender ?? throw new ArgumentNullException(nameof(sender));
    }

    [HttpGet]
    [ProducesResponseType(typeof(Result<IEnumerable<BillCategoryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public Task<Result<IEnumerable<BillCategoryDto>>> List(CancellationToken cancellationToken)
    {
        var query = new ListBillCategoriesQuery();

        return sender.Send(query, cancellationToken);
    }
}
