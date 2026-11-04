using Andaha.Services.Shopping.Core;

namespace Andaha.Services.Shopping.Tests.Bill;

public class BillUpdateTests
{
    private static Core.Bill NewBill() =>
        new(null, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "Billa", 5, notes: "alt");

    [Fact]
    public void Update_without_sub_category_clears_it()
    {
        var bill = NewBill();

        bill.Update(bill.CategoryId, null, "Billa", 5, DateTime.UtcNow, "alt");

        Assert.Null(bill.SubCategoryId);
    }

    [Fact]
    public void Update_without_notes_clears_them()
    {
        var bill = NewBill();

        bill.Update(bill.CategoryId, bill.SubCategoryId, "Billa", 5, DateTime.UtcNow, null);

        Assert.Null(bill.Notes);
    }

    [Fact]
    public void Update_with_sub_category_sets_it()
    {
        var bill = NewBill();
        var sub = Guid.NewGuid();

        bill.Update(bill.CategoryId, sub, "Billa", 5, DateTime.UtcNow, "x");

        Assert.Equal(sub, bill.SubCategoryId);
        Assert.Equal("x", bill.Notes);
    }
}
