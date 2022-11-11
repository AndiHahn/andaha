using MediatR;
using Microsoft.AspNetCore.Http;

namespace Andaha.CrossCutting.Application.Requests;

public interface IHttpRequest : IRequest<IResult>
{
}
