namespace Andaha.Services.BudgetPlan.Common;

public static class DoubleExtensions
{
    public static double RoundTo(this double value, int decimals) => Math.Round(value, decimals);
}
