using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class BillCategory : Entity<Guid>
{
    private readonly List<Bill> bills = new();
    private readonly List<BillSubCategory> subCategories = new();

    private BillCategory()
    {
    }

    public BillCategory(
        Guid userId,
        string name,
        string color,
        IReadOnlyCollection<string> subCategories,
        bool isDefault = false)
        : base(Guid.NewGuid())
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId must not be empty.", nameof(userId));
        }

        this.UserId = userId;
        this.IsDefault = isDefault;

        this.Update(name, color);

        foreach (var subCategory in subCategories)
        {
            this.AddSubCategory(subCategory);
        }
    }

    public Guid UserId { get; private set; }

    public string Name { get; private set; } = null!;

    public string Color { get; private set; } = null!;

    public bool IsDefault { get; private set; }

    public IReadOnlyCollection<Bill> Bills => bills.AsReadOnly();

    public IReadOnlyCollection<BillSubCategory> SubCategories => subCategories.AsReadOnly();

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

    public void AddSubCategory(string name)
    {
        var subCategory = new BillSubCategory(this.Id, name);

        this.subCategories.Add(subCategory);
    }

    public void UpdateSubCategory(Guid id, string name)
    {
        var subCategory = this.SubCategories.Single(category => category.Id == id);

        subCategory.Update(name);
    }

    public void RemoveSubCategory(Guid id)
    {
        var subCategory = this.SubCategories.Single(category => category.Id == id);

        this.subCategories.Remove(subCategory);
    }
}
