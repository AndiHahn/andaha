using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Collaboration.Requests.DeclineConnectionRequest;

public record DeclineConnectionRequestRequest(Guid FromUserId) : IHttpRequest;
