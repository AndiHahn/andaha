using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Work.Requests.Person.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Person.UpdatePayment.V1;

public record UpdatePaymentCommand(
    Guid PersonId,
    Guid PaymentId,
    [property: FromBody] UpdatePaymentDto Payment) : IHttpRequest;
