using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class BillSubCategory : Entity<Guid>
{
	private BillSubCategory()
	{
	}

    public BillSubCategory(Guid categoryId, string name)
		: base(Guid.NewGuid())
	{
		this.CategoryId = categoryId;
		this.Name = name;
	}

    public Guid CategoryId { get; private set; }

	public string Name { get; private set; } = null!;

	public BillCategory Category { get; private set; } = null!;

	public void Update(string name)
	{
		this.Name = name;
	}
}
