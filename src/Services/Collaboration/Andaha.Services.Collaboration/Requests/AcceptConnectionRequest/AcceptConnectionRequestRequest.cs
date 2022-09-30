namespace Andaha.Services.Collaboration.Requests.AcceptConnectionRequest;

public record AcceptConnectionRequestRequest(Guid FromUserId) : IHttpRequest;
