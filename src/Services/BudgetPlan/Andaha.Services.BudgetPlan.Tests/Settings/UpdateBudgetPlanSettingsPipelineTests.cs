using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Requests.Settings.UpdateBudgetPlanSettings.V1;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace Andaha.Services.BudgetPlan.Tests.Settings;

/// <summary>
/// Sends the command through the real MediatR pipeline, registered by the same AddCustomApplicationServices that the
/// standalone host and the Monolith (via AddBudgetPlanServices) use, so the validator has to run before the handler.
/// </summary>
public class UpdateBudgetPlanSettingsPipelineTests
{
    private static WebApplication BuildApp(SqliteConnection connection, Guid userId)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(userId);

        var builder = WebApplication.CreateBuilder();
        builder.AddCustomApplicationServices();

        // Test doubles for the database and the signed-in user; the last registration wins.
        builder.Services.AddScoped(_ => TestDb.NewContext(connection));
        builder.Services.AddSingleton(identity);

        return builder.Build();
    }

    private static async Task<IResult> SendAsync(SqliteConnection connection, Guid userId, int livingCostShare)
    {
        await using var app = BuildApp(connection, userId);
        using var scope = app.Services.CreateScope();

        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        return await mediator.Send(new UpdateBudgetPlanSettingsCommand(livingCostShare));
    }

    [Theory]
    [InlineData(101)]
    [InlineData(-1)]
    public async Task Put_out_of_range_returns_400_validation_problem_and_saves_nothing(int livingCostShare)
    {
        var (context, connection) = TestDb.CreateBudgetPlan();
        using (connection)
        using (context)
        {
            var result = await SendAsync(connection, Guid.NewGuid(), livingCostShare);

            var problem = Assert.IsType<ValidationProblem>(result);
            Assert.Equal(StatusCodes.Status400BadRequest, problem.StatusCode);
            Assert.Contains(nameof(UpdateBudgetPlanSettingsCommand.LivingCostShare), problem.ProblemDetails.Errors.Keys);
            Assert.Empty(context.BudgetPlanSettings.AsNoTracking());
        }
    }

    [Fact]
    public async Task Put_50_returns_204_and_saves_the_value()
    {
        var (context, connection) = TestDb.CreateBudgetPlan();
        using (connection)
        using (context)
        {
            var userId = Guid.NewGuid();

            var result = await SendAsync(connection, userId, 50);

            Assert.IsType<NoContent>(result);
            var settings = Assert.Single(context.BudgetPlanSettings.AsNoTracking());
            Assert.Equal(userId, settings.UserId);
            Assert.Equal(50, settings.LivingCostShare);
        }
    }
}
