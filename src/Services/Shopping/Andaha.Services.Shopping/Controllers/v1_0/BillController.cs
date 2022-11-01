﻿using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Application.Bill.Commands.UpdateBill;
using Andaha.Services.Shopping.Application.Commands.CreateBill;
using Andaha.Services.Shopping.Application.Commands.DeleteBill;
using Andaha.Services.Shopping.Application.Queries.GetBillById;
using Andaha.Services.Shopping.Application.Queries.SearchBills;
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
public class BillController : ControllerBase
{
    private readonly ISender sender;

    public BillController(ISender sender)
    {
        this.sender = sender ?? throw new ArgumentNullException(nameof(sender));
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<BillDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public Task<PagedResult<BillDto>> List([FromQuery] SearchBillsParameters searchParameters, CancellationToken cancellationToken)
    {
        var query = new SearchBillsQuery(searchParameters.PageSize, searchParameters.PageIndex, searchParameters.Search);

        return sender.Send(query, cancellationToken);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(BillDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public Task<Result<BillDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetBillByIdQuery(id);

        return sender.Send(query, cancellationToken);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BillDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddBill([FromBody] BillCreateDto createDto, CancellationToken cancellationToken)
    {
        var command = new CreateBillCommand(
            createDto.Id,
            createDto.CategoryId,
            createDto.ShopName,
            createDto.Price,
            createDto.Date,
            createDto.Notes);

        var createdBill = await sender.Send(command, cancellationToken);

        if (createdBill.Status != ResultStatus.Success) return this.ToActionResult(createdBill);

        return Created($"{HttpContext.Request.Path}/{createdBill.Value.Id}", createdBill.Value);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(BillDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<Result<BillDto>> UpdateBill(Guid id, [FromBody] BillUpdateDto updateDto, CancellationToken cancellationToken)
    {
        var command = new UpdateBillCommand(
            id,
            updateDto.CategoryId,
            updateDto.ShopName,
            updateDto.Price,
            updateDto.Date,
            updateDto.Notes);

        return await sender.Send(command, cancellationToken);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<Result> DeleteBill(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteBillCommand(id);

        return await sender.Send(command, cancellationToken);
    }
}
