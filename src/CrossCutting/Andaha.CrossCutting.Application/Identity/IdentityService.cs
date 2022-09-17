using Microsoft.AspNetCore.Http;

namespace Andaha.CrossCutting.Application.Identity;
internal class IdentityService : IIdentityService
{
    private readonly IHttpContextAccessor _context;

    public IdentityService(IHttpContextAccessor context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public Guid GetUserId()
        => new (_context.HttpContext?.User?.FindFirst("sub")?.Value ??
            throw new InvalidOperationException("No sub claim available."));
}
