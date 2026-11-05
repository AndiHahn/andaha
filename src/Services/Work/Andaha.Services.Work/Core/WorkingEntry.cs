using CSharpFunctionalExtensions;

namespace Andaha.Services.Work.Core;

public class WorkingEntry : Entity<Guid>
{
    private WorkingEntry()
    {
    }

    public WorkingEntry(
        Person person,
        DateTime from,
        DateTime until,
        TimeSpan @break,
        string? notes)
        : base(Guid.NewGuid())
    {
        if (person is null)
        {
            throw new ArgumentNullException(nameof(person));
        }

        EnsureUntilAfterFrom(from, until);

        this.PersonId = person.Id;
        this.Person = person;
        this.From = from;
        this.Until = until;
        this.Break = @break;
        this.Notes = notes;
        this.Person = person;

        CalculateWorkDuration();
    }

    public Guid PersonId { get; private set; }

    public DateTime From { get; private set; }

    public DateTime Until { get; private set; }

    public long WorkDurationTicks { get; private set; }

    public TimeSpan Break { get; private set; }

    public string? Notes { get; private set; }

    public virtual Person Person { get; private set; } = null!;

    public void Update(
        DateTime? from = null,
        DateTime? until = null,
        TimeSpan? @break = null,
        string? notes = null)
    {
        var newFrom = from ?? this.From;
        var newUntil = until ?? this.Until;

        EnsureUntilAfterFrom(newFrom, newUntil);

        this.From = newFrom;
        this.Until = newUntil;
        this.Break = @break ?? this.Break;
        this.Notes = notes ?? this.Notes;

        CalculateWorkDuration();
    }

    private static void EnsureUntilAfterFrom(DateTime from, DateTime until)
    {
        if (until <= from)
        {
            throw new ArgumentException("Until timestamp must be > from timestamp.", nameof(until));
        }
    }

    private void CalculateWorkDuration()
    {
        this.WorkDurationTicks = this.Until.Ticks - this.From.Ticks - this.Break.Ticks;
    }
}
