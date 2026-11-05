using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Collaboration.Requests.RemoveConnection.V1;

public record RemoveConnectionRequest(Guid UserId) : IHttpRequest;
