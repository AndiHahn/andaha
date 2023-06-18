using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Work.Requests.Person.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Person.PayPerson.V1;

public record PayPersonRequest(
    Guid Id,
    [property: FromBody] PayPersonDto PayPerson) : IHttpRequest;
