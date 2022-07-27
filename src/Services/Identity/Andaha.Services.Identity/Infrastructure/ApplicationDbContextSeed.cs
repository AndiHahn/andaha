using Andaha.Services.Identity.Domain;
using Microsoft.AspNetCore.Identity;

namespace Andaha.Services.Identity.Infrastructure;

public static class ApplicationDbContextSeed
{
    public static async Task SeedAsync(UserManager<ApplicationUser> userManager)
    {
        var user = await userManager.FindByNameAsync("Andreas");
        if (user is null)
        {
            user = new ApplicationUser("Andreas");

            await userManager.CreateAsync(user, "Pass123$");
        }
    }
}
