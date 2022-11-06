using Ardalis.SmartEnum;

namespace Andaha.Services.BudgetPlan.Core;

public abstract class Duration : SmartEnum<Duration>
{
    private Duration(string name, int value) : base(name, value)
    {
    }

    public static readonly Duration Monthly = new MonthlyDuration();

    public static readonly Duration QuarterYear = new QuarterYearDuration();

    public static readonly Duration HalfYear = new HalfYearDuration();

    public static readonly Duration Year = new YearDuration();

    public abstract double GetMonthlyValue(double value);

    private sealed class MonthlyDuration : Duration
    {
        public MonthlyDuration() : base(nameof(Monthly), 10)
        {
        }

        public override double GetMonthlyValue(double value) => value;
    }

    private sealed class QuarterYearDuration : Duration
    {
        public QuarterYearDuration() : base(nameof(QuarterYear), 20)
        {
        }

        public override double GetMonthlyValue(double value) => value / 3.0;
    }

    private sealed class HalfYearDuration : Duration
    {
        public HalfYearDuration() : base(nameof(HalfYear), 30)
        {
        }

        public override double GetMonthlyValue(double value) => value / 6.0;
    }

    private sealed class YearDuration : Duration
    {
        public YearDuration() : base(nameof(Year), 40)
        {
        }

        public override double GetMonthlyValue(double value) => value / 12.0;
    }
}
