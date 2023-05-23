using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.WorkingEntry.ListWorkingEntries.V1;

public class ListWorkingEntriesRequestHandler : IRequestHandler<ListWorkingEntriesRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public ListWorkingEntriesRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(ListWorkingEntriesRequest request, CancellationToken cancellationToken)
    {
        var userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var entries = await this.dbContext.WorkingEntry
            .AsNoTracking()
            .Include(entry => entry.Person)
            .Where(entry => entry.PersonId == request.PersonId)
            .OrderByDescending(entry => entry.From)
            .ToListAsync(cancellationToken);

        if (!entries.Any())
        {
            return Results.Ok(new List<WorkingEntryDto>());
        }

        var person = entries.First().Person;

        if (!person.HasCreated(userId) && !connectedUsers.Contains(person.UserId))
        {
            return Results.Forbid();
        }

        return Results.Ok(entries.Select(entry => WorkingEntryDtoMapping.EntityToDto.Invoke(entry)));
    }
}
