using CSharpFunctionalExtensions;

namespace Andaha.Services.BudgetPlan.Core;

public class FixedCost : Entity<Guid>
{
    private FixedCost()
    {
    }

    public FixedCost(Guid userId, string name, double value, Duration duration, CostCategory category)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id must not be empty.");
        }

        if (string.IsNullOrEmpty(name))
        {
            throw new ArgumentException("Name must not be null or empty.");
        }

        if (value <= 0)
        {
            throw new ArgumentException("Value must be > 0.");
        }

        this.UserId = userId;
        this.Name = name;
        this.Value = value;
        this.Duration = duration;
        this.Category = category;
    }

    public Guid UserId { get; private set; }

    public string Name { get; private set; }

    public double Value { get; private set; }

    public Duration Duration { get; private set; }

    public CostCategory Category { get; private set; }

    public double GetMonthlyValue() => this.Duration.GetMonthlyValue(this.Value);
}
