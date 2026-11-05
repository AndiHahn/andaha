using CSharpFunctionalExtensions;

namespace Andaha.Services.Work.Core;

public class Person : Entity<Guid>
{
    private Person()
    {
    }

    public Person(
        Guid createdByUserId,
        string name,
        double hourlyRate,
        string? notes)
    : base(Guid.NewGuid())
    {
        if (createdByUserId == Guid.Empty)
        {
            throw new ArgumentException("Parameter must not be empty.", nameof(createdByUserId));
        }

        if (string.IsNullOrEmpty(name))
        {
            throw new ArgumentNullException(nameof(name));
        }

        if (hourlyRate < 0)
        {
            throw new ArgumentException("Hourly rate must not be negative.", nameof(hourlyRate));
        }

        UserId = createdByUserId;
        Name = name;
        HourlyRate = hourlyRate;
        Notes = notes;
    }

    public Guid UserId { get; private set; }

    public string Name { get; private set; } = null!;

    public double HourlyRate { get; private set; }
        
    public string? Notes { get; private set; }

    public virtual ICollection<Payment> Payments { get; private set; } = new List<Payment>();

    public virtual ICollection<WorkingEntry> WorkingEntries { get; private set; } = new List<WorkingEntry>();

    public void AddPayment(TimeSpan payedTime, double payedMoney, double payedTip, string? notes)
    {
        var payment = new Payment(this, payedTime, payedMoney, payedTip, notes);

        this.Payments.Add(payment);
    }

    /// <summary>
    /// Changes a payment of this person. Returns false if the person has no payment with this id.
    /// </summary>
    public bool UpdatePayment(Guid paymentId, TimeSpan payedTime, double payedMoney, double payedTip, string? notes)
    {
        var payment = this.Payments.FirstOrDefault(payment => payment.Id == paymentId);
        if (payment is null)
        {
            return false;
        }

        payment.Update(payedTime, payedMoney, payedTip, notes);

        return true;
    }

    /// <summary>
    /// Removes a payment from this person and returns it, or null if the person has no payment with this id.
    /// The relationship does not cascade, so the caller deletes the returned payment from the database.
    /// </summary>
    public Payment? RemovePayment(Guid paymentId)
    {
        var payment = this.Payments.FirstOrDefault(payment => payment.Id == paymentId);
        if (payment is not null)
        {
            this.Payments.Remove(payment);
        }

        return payment;
    }

    public bool HasCreated(Guid userId) => this.UserId == userId;

    public void Update(
        string? name = null,
        double? hourlyRate = null,
        string? notes = null)
    {
        this.Name = name ?? this.Name;
        this.HourlyRate = hourlyRate ?? this.HourlyRate;
        this.Notes = notes ?? this.Notes;
    }

    public void AddWorkingEntry(
        DateTime from,
        DateTime until,
        TimeSpan @break,
        string? notes)
    {
        this.WorkingEntries.Add(new WorkingEntry(this, from, until, @break, notes));
    }

    public void RemoveWorkingEntry(WorkingEntry entry)
    {
        this.WorkingEntries.Remove(entry);
    }
}
