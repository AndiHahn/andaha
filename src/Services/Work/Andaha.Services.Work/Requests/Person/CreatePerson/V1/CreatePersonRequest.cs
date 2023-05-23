using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Work.Requests.Person.Dtos.V1;

namespace Andaha.Services.Work.Requests.Person.CreatePerson.V1;

public record CreatePersonRequest(CreatePersonDto Person) : IHttpRequest;
