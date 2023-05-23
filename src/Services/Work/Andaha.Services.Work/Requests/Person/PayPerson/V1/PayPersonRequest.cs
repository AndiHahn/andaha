using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Person.PayPerson.V1;

public record PayPersonRequest(Guid Id, [property: FromBody] double PayedHours) : IHttpRequest;
