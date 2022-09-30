using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Collaboration.Requests.RequestAccountConnection;

public record RequestAccountConnectionRequest(string TargetUserEmailAddress) : IHttpRequest;
