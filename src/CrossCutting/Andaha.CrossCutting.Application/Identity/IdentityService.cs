using Microsoft.AspNetCore.Http;

namespace Andaha.CrossCutting.Application.Identity;
internal class IdentityService : IIdentityService
{
    private readonly IHttpContextAccessor _context;

    public IdentityService(IHttpContextAccessor context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public Guid GetUserId() => new ("cfe4eb84-86ab-42f7-89a1-ca349dbbe085");

    /*
    public Guid GetUserId()
        => new (_context.HttpContext?.User?.FindFirst("sub")?.Value ??
            throw new InvalidOperationException("No sub claim available."));
    */
}
