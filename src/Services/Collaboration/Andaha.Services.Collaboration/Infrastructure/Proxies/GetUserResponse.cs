namespace Andaha.Services.Collaboration.Infrastructure.Proxies;

public readonly record struct GetUserResponse(Guid Id, string Name, string Email);
