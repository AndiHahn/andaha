using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Application.Expense.Queries.GetAvailableTimeRange;
using Andaha.Services.Shopping.Application.Expense.Queries.GetExpenses;
using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Controllers.v1_0;

[MapToProblemDetails]
[Consumes("application/json")]
[Produces("application/json")]
[ApiVersion("1.0")]
[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ExpenseController : ControllerBase
{
    private readonly ISender sender;

    public ExpenseController(ISender sender)
    {
        this.sender = sender ?? throw new ArgumentNullException(nameof(sender));
    }
        
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<ExpenseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public Task<IReadOnlyCollection<ExpenseDto>> GetExpenses(
        [FromQuery] DateTime startTimeUtc,
        [FromQuery] DateTime endTimeUtc,
        CancellationToken cancellationToken)
    {
        var query = new GetExpensesQuery(startTimeUtc, endTimeUtc);

        return this.sender.Send(query, cancellationToken);
    }

    [HttpGet("time-range")]
    [ProducesResponseType(typeof(TimeRangeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<TimeRangeDto> GetAvailableTimeRange(CancellationToken cancellationToken)
    {
        var query = new GetAvailableTimeRangeQuery();

        var timeRange = await this.sender.Send(query, cancellationToken);

        return timeRange;
    }
}
