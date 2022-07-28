using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class BillCategory : Entity<Guid>
{
    private readonly List<Bill> _bills = new();

    private BillCategory()
    {
    }

    public BillCategory(string name, string color)
    {
        this.Update(name, color);
    }

    public string Name { get; private set; } = null!;

    public string Color { get; private set; } = null!;

    public IReadOnlyCollection<Bill> Bills => _bills;

    public void Update(string name, string color)
    {
        if (string.IsNullOrEmpty(name))
        {
            throw new ArgumentNullException(nameof(name));
        }

        if (string.IsNullOrEmpty(color))
        {
            throw new ArgumentNullException(nameof(color));
        }

        if (name.Length > 200)
        {
            throw new ArgumentException("Length of name must not be > 200 characters.", nameof(name));
        }

        if (color.Length > 20)
        {
            throw new ArgumentException("Length of name must not be > 20 characters.", nameof(color));
        }

        this.Name = name;
        this.Color = color;
    }
}
