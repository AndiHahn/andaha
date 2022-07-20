using Andaha.Services.Shopping.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Polly;

namespace Andaha.Services.Shopping;

public static class WebApplicationExtensions
{
    public static async Task<WebApplication> MigrateAndSeedDatabaseAsync(this WebApplication webApplication, ILogger logger)
    {
        using var scope = webApplication.Services.CreateScope();

        var retryPolicy = CreateRetryPolicy(logger);

        var context = scope.ServiceProvider.GetRequiredService<ShoppingDbContext>();

        retryPolicy.Execute(context.Database.Migrate);
        await ShoppingDbContextSeed.SeedAsync(context);

        return webApplication;
    }

    private static Policy CreateRetryPolicy(ILogger logger)
    {
        return Policy.Handle<Exception>()
            .WaitAndRetryForever(
                sleepDurationProvider: retry => TimeSpan.FromSeconds(5),
                onRetry: (exception, retry, timeSpan) =>
                {
                    logger.LogWarning(
                        exception,
                        "Exception {ExceptionType} with message {Message} detected during database migration (retry attempt {retry})",
                        exception.GetType().Name,
                        exception.Message,
                        retry);
                }
            );
    }
}
