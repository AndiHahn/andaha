using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Collaboration.Requests.WithdrawConnectionRequest.V1;

public record WithdrawConnectionRequestRequest(Guid TargetUserId) : IHttpRequest;
