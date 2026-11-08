using Andaha.Services.Shopping.Requests.Bill;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Tests.Bill;

public class BillConfidenceDtoTests
{
    private static readonly Guid User = Guid.NewGuid();

    [Fact]
    public async Task Bill_dto_contains_confidences_and_amount_text_of_auto_created_bill()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var category = new Core.BillCategory(User, "ZZ Cat", "red", 0, Array.Empty<(string, int)>());
            context.BillCategory.Add(category);
            var bill = new Core.Bill(null, User, category.Id, null, "Shop", 4.15, DateTime.UtcNow,
                fromAutoAnalysis: true, confidence: 0.95, totalAmountConfidence: 0.9,
                shopNameConfidence: 0.8, dateConfidence: 0.7, totalAmountText: "4,15");
            context.Bill.Add(bill);
            await context.SaveChangesAsync();

            var dto = await context.FindBillDtoByIdAsync(bill.Id, User, CancellationToken.None);

            Assert.NotNull(dto);
            Assert.Equal(0.95, dto.Confidence);
            Assert.Equal(0.9, dto.TotalAmountConfidence);
            Assert.Equal(0.8, dto.ShopNameConfidence);
            Assert.Equal(0.7, dto.DateConfidence);
            Assert.Equal("4,15", dto.TotalAmountText);
        }
    }

    [Fact]
    public async Task Manually_created_bill_has_null_confidences()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var category = new Core.BillCategory(User, "ZZ Cat", "red", 0, Array.Empty<(string, int)>());
            context.BillCategory.Add(category);
            var bill = new Core.Bill(null, User, category.Id, null, "Shop", 4.15, DateTime.UtcNow);
            context.Bill.Add(bill);
            await context.SaveChangesAsync();

            var dto = await context.FindBillDtoByIdAsync(bill.Id, User, CancellationToken.None);

            Assert.NotNull(dto);
            Assert.Null(dto.Confidence);
            Assert.Null(dto.TotalAmountConfidence);
            Assert.Null(dto.ShopNameConfidence);
            Assert.Null(dto.DateConfidence);
            Assert.Null(dto.TotalAmountText);
        }
    }
}
