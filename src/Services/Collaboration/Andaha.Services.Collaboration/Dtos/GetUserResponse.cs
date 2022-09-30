namespace Andaha.Services.Collaboration.Dtos;

public readonly record struct GetUserResponse(Guid Id, string Name, string Email);
