using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Andaha.CrossCutting.Application.Identity;
internal class IdentityService : IIdentityService
{
    private readonly IHttpContextAccessor httpContext;

    public IdentityService(IHttpContextAccessor context)
    {
        this.httpContext = context ?? throw new ArgumentNullException(nameof(context));
    }

    public Guid GetUserId()
    {
        var user = httpContext.HttpContext?.User;

        var subClaim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (subClaim is null)
        {
            throw new InvalidOperationException($"No {nameof(ClaimTypes.NameIdentifier)} claim available.");
        }

        return new Guid(subClaim);
    }

    public string GetUserEmailAddress()
    {
        var user = httpContext.HttpContext?.User;

        var emailClaim = user?.FindFirst(ClaimTypes.Email)?.Value;

        if (emailClaim is null)
        {
            throw new InvalidOperationException("No email claim available.");
        }

        return emailClaim;
    } 
}
