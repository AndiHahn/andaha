using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using MediatR;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.UserData.DeleteUserData.V1;

/// <summary>
/// Deletes all budget plan data of the current user: fixed costs, incomes and settings, including the
/// previous versions of fixed costs and incomes kept in the history tables of the temporal tables.
/// </summary>
internal class DeleteUserDataCommandHandler : IRequestHandler<DeleteUserDataCommand, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public DeleteUserDataCommandHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(DeleteUserDataCommand request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var strategy = this.dbContext.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await this.dbContext.Database.BeginTransactionAsync(cancellationToken);

            await this.dbContext.FixedCost.Where(fixedCost => fixedCost.UserId == userId).ExecuteDeleteAsync(cancellationToken);
            await this.dbContext.Income.Where(income => income.UserId == userId).ExecuteDeleteAsync(cancellationToken);
            await this.dbContext.BudgetPlanSettings.Where(settings => settings.UserId == userId).ExecuteDeleteAsync(cancellationToken);

            // Temporal tables (SQL Server only) have just moved the deleted rows into their history tables.
            if (this.dbContext.Database.IsSqlServer())
            {
                await this.PurgeHistoryAsync<Core.FixedCost>(userId, cancellationToken);
                await this.PurgeHistoryAsync<Core.Income>(userId, cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
        });

        return Results.NoContent();
    }

    /// <summary>
    /// History rows are read-only while system versioning is on. Versioning is switched off, the user's history
    /// rows are deleted and versioning is switched on again with the same history table, all in the caller's transaction.
    /// </summary>
    private async Task PurgeHistoryAsync<TEntity>(Guid userId, CancellationToken cancellationToken)
        where TEntity : class
    {
        var entityType = this.dbContext.Model.FindEntityType(typeof(TEntity))
            ?? throw new InvalidOperationException($"Entity type '{typeof(TEntity).Name}' is not part of the model.");

        string table = DelimitTableName(entityType.GetSchema(), entityType.GetTableName()!);

        // The history table as it exists in the database, so versioning is switched on again with exactly that table.
        string historyTable = await this.dbContext.Database
            .SqlQuery<string>($"""
                SELECT QUOTENAME(OBJECT_SCHEMA_NAME(history_table_id)) + N'.' + QUOTENAME(OBJECT_NAME(history_table_id)) AS [Value]
                FROM sys.tables
                WHERE object_id = OBJECT_ID({table}) AND temporal_type = 2
                """)
            .SingleAsync(cancellationToken);

        // One command per statement, so each one is compiled only after the previous one changed the table.
        string versioningOff = $"ALTER TABLE {table} SET (SYSTEM_VERSIONING = OFF)";
        string deleteHistory = $"DELETE FROM {historyTable} WHERE [UserId] = @userId";
        string versioningOn = $"ALTER TABLE {table} SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = {historyTable}))";

        await this.dbContext.Database.ExecuteSqlRawAsync(versioningOff, cancellationToken);
        await this.dbContext.Database.ExecuteSqlRawAsync(deleteHistory, [new SqlParameter("@userId", userId)], cancellationToken);
        await this.dbContext.Database.ExecuteSqlRawAsync(versioningOn, cancellationToken);
    }

    private static string DelimitTableName(string? schema, string name)
        => schema is null ? Delimit(name) : $"{Delimit(schema)}.{Delimit(name)}";

    private static string Delimit(string identifier) => $"[{identifier.Replace("]", "]]")}]";
}
