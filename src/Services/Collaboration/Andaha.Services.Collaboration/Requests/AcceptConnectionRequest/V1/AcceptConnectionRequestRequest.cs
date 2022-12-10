using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Collaboration.Requests.AcceptConnectionRequest.V1;

public record AcceptConnectionRequestRequest(Guid FromUserId) : IHttpRequest;
