using Andaha.Services.Identity.Domain;
using Microsoft.AspNetCore.Identity;

namespace Andaha.Services.Identity.Infrastructure;

public static class ApplicationDbContextSeed
{
    public static async Task SeedAsync(UserManager<ApplicationUser> userManager)
    {
        await TryCreateUserAsync(userManager, "Andreas", "Pass123$");
        await TryCreateUserAsync(userManager, "Test1", "Pass123$");
        await TryCreateUserAsync(userManager, "Test2", "Pass123$");
    }

    private static async Task TryCreateUserAsync(UserManager<ApplicationUser> userManager, string name, string password)
    {
        var user = await userManager.FindByNameAsync(name);
        if (user is null)
        {
            user = new ApplicationUser()
            {
                Id = Guid.NewGuid().ToString(),
                UserName = name,
                Email = $"{name}@email.at",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Could not create user: {result.Errors.First().Description}");
            }
        }
    }
}
