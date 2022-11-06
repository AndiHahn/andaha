using CSharpFunctionalExtensions;

namespace Andaha.Services.BudgetPlan.Core;

public class Income : Entity<Guid>
{
    private Income()
    {
    }

    public Income(Guid userId, string name, double value, Duration duration)
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
    }

    public Guid UserId { get; private set; }

    public string Name { get; private set; }

    public double Value { get; private set; }

    public Duration Duration { get; private set; }
}
