using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Work.Requests.Person.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Person.UpdatePerson.V1;

public record UpdatePersonRequest(
    Guid Id,
    [property: FromBody] UpdatePersonDto UpdatePerson) : IHttpRequest;
