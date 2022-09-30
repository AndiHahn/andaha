namespace Andaha.Services.Collaboration.Dtos;

public readonly record struct ConnectionRequestDto(Guid FromUserId, string FromUserEmailAddress, Guid TargetUserId, string TargetUserEmailAddress, bool Declined);
