using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Collaboration.Requests.RequestAccountConnection.V1;

public record RequestAccountConnectionRequest(string TargetUserEmailAddress) : IHttpRequest;
