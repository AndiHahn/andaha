using CSharpFunctionalExtensions;

namespace Andaha.Services.Work.Core;

public class Payment : Entity<Guid>
{
    private Payment()
    {
    }

    public Payment(
        Person person,
        TimeSpan payedTime,
        double payedMoney,
        double payedTip,
        string? notes)
    : base(Guid.NewGuid())
    {
        if (payedMoney <= 0)
        {
            throw new ArgumentException("Parameter must be > 0.", nameof(payedMoney));
        }

        if (payedTip < 0)
        {
            throw new ArgumentException("Parameter must be >= 0.", nameof(payedTip));
        }

        this.PersonId = person.Id;
        this.PayedHoursTicks = payedTime.Ticks;
        this.PayedMoney = payedMoney;
        this.PayedTip = payedTip;
        this.Notes = notes;
        this.PayedAt = DateTime.UtcNow;
        this.Person = person;
    }

    public Guid PersonId { get; private set; }

    public long PayedHoursTicks { get; private set; } = 0;

    public double PayedMoney { get; private set; }

    public double PayedTip { get; private set; }

    public DateTime PayedAt { get; private set; }

    public string? Notes { get; private set; }

    public Person Person { get; private set; }
}
