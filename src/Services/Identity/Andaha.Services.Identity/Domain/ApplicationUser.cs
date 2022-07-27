using Microsoft.AspNetCore.Identity;

namespace Andaha.Services.Identity.Domain;

public class ApplicationUser : IdentityUser
{
    public ApplicationUser()
    {
    }

    public ApplicationUser(string userName)
        : base(userName)
    {
    }
}
