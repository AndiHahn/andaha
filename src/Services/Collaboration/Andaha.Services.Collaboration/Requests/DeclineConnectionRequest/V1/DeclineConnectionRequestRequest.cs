using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Collaboration.Requests.DeclineConnectionRequest.V1;

public record DeclineConnectionRequestRequest(Guid FromUserId) : IHttpRequest;
