using Andaha.Services.Shopping.Application.Services;
using Andaha.Services.Shopping.Dtos.v1_0;
using Andaha.Services.Shopping.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Application.Expense.Queries.GetAvailableTimeRange;

internal class GetAvailableTimeRangeQueryHandler : IRequestHandler<GetAvailableTimeRangeQuery, TimeRangeDto>
{
    private readonly ShoppingDbContext dbContext;
    private readonly ICollaborationService collaborationService;

    public GetAvailableTimeRangeQueryHandler(
        ShoppingDbContext dbContext,
        ICollaborationService collaborationService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.collaborationService = collaborationService ?? throw new ArgumentNullException(nameof(collaborationService));
    }

    public async Task<TimeRangeDto> Handle(GetAvailableTimeRangeQuery request, CancellationToken cancellationToken)
    {
        await this.collaborationService.SetConnectedUsersAsync(cancellationToken);

        var result = await this.dbContext.Bill
            .Select(bill => new
            {
                StartDate = this.dbContext.Bill.Min(b => b.Date),
                EndDate = this.dbContext.Bill.Max(b => b.Date)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return new TimeRangeDto();
        }

        return new TimeRangeDto(result.StartDate, result.EndDate);
    }
}
