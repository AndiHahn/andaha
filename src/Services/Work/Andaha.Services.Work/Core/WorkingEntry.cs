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

        if (from > until)
        {
            throw new ArgumentException("Until timestamp must be > from timestamp.");
        }

        this.PersonId = person.Id;
        this.Person = person;
        this.From = from;
        this.Until = until;
        this.Break = @break;
        this.Notes = notes;
        this.Person = person;
    }

    public Guid PersonId { get; private set; }

    public DateTime From { get; private set; }

    public DateTime Until { get; private set; }

    public TimeSpan Break { get; private set; }

    public string? Notes { get; private set; }

    public virtual Person Person { get; private set; } = null!;

    public void Update(
        DateTime? from = null,
        DateTime? until = null,
        TimeSpan? @break = null,
        string? notes = null)
    {
        this.From = from ?? this.From;
        this.Until = until ?? this.Until;
        this.Break = @break ?? this.Break;
        this.Notes = notes ?? this.Notes;
    }
}
