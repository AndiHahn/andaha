namespace Andaha.Services.Collaboration.Dtos.V1;

public readonly record struct ConnectionRequestDto(Guid FromUserId, string FromUserEmailAddress, Guid TargetUserId, string TargetUserEmailAddress, bool Declined);
