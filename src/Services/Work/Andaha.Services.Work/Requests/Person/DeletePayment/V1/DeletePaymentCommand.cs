using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Work.Requests.Person.DeletePayment.V1;

public record DeletePaymentCommand(Guid PersonId, Guid PaymentId) : IHttpRequest;
