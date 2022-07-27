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
            user = new ApplicationUser()
            {
                Id = Guid.NewGuid().ToString(),
                UserName = "Andreas",
                Email = "andreas@email.at",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, "Pass123$");
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Could not create user: {result.Errors.First().Description}");
            }
        }
    }
}
