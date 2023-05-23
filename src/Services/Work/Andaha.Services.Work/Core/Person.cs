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

    public double PayedHous { get; private set; } = 0;

    public DateTime? LastPayed { get; private set; } = null!;

    public string? Notes { get; private set; }
    
    public virtual ICollection<WorkingEntry> WorkingEntries { get; private set; } = new List<WorkingEntry>();

    public void PayHours(double payedHours)
    {
        this.PayedHous += payedHours;

        this.LastPayed = DateTime.UtcNow;
    }

    public bool HasCreated(Guid userId) => this.UserId == userId;

    public void Update(
        string? name = null,
        double? hourlyRate = null,
        double? payedHours = null,
        string? notes = null)
    {
        this.Name = name ?? this.Name;
        this.HourlyRate = hourlyRate ?? this.HourlyRate;
        this.Notes = notes ?? this.Notes;
        this.PayedHous = payedHours ?? this.PayedHous;
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
