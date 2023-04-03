using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class BillSubCategory : Entity<Guid>
{
    private BillSubCategory()
    {
    }

    public BillSubCategory(Guid categoryId, string name, int order)
        : base(Guid.NewGuid())
    {
        this.CategoryId = categoryId;
        this.Update(name, order);
    }

    public Guid CategoryId { get; private set; }

    public string Name { get; private set; } = null!;

    public int Order { get; private set; }

    public BillCategory Category { get; private set; } = null!;

    public void Update(string name, int order)
    {
        this.Name = name;

        this.UpdateOrder(order);
    }

    public void UpdateOrder(int order)
    {
        this.Order = order;
    }
}
