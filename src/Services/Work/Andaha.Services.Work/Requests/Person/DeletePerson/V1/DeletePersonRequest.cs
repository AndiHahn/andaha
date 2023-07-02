using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Work.Requests.Person.DeletePerson.V1;

public record DeletePersonRequest(Guid Id) : IHttpRequest;
