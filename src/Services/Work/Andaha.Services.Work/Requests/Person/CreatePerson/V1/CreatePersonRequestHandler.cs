using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Requests.Person.Dtos.V1;
using LinqKit;
using MediatR;

namespace Andaha.Services.Work.Requests.Person.CreatePerson.V1;

internal class CreatePersonRequestHandler : IRequestHandler<CreatePersonRequest, IResult>
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;

    public CreatePersonRequestHandler(
        WorkDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(CreatePersonRequest request, CancellationToken cancellationToken)
    {
        var userId = identityService.GetUserId();

        var newPerson = dbContext.Person.Add(
            new Core.Person(
                userId,
                request.Person.Name,
                request.Person.HourlyRate,
                request.Person.Notes));

        await dbContext.SaveChangesAsync(cancellationToken);

        var person = PersonDtoMapping.EntityToDto.Invoke(newPerson.Entity, userId);

        return Results.Ok(person);
    }
}
