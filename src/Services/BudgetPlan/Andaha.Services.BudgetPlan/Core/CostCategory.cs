using Ardalis.SmartEnum;

namespace Andaha.Services.BudgetPlan.Core;

public sealed class CostCategory : SmartEnum<CostCategory>
{
    private CostCategory(string name, int value) : base(name, value)
    {
    }

    public static readonly CostCategory FlatAndOperating = new CostCategory(nameof(FlatAndOperating), 10);

    public static readonly CostCategory MotorVehicle = new CostCategory(nameof(MotorVehicle), 20);

    public static readonly CostCategory Insurance = new CostCategory(nameof(Insurance), 30);

    public static readonly CostCategory Saving = new CostCategory(nameof(Saving), 40);

    public static readonly CostCategory Other = new CostCategory(nameof(Other), 999);
}
