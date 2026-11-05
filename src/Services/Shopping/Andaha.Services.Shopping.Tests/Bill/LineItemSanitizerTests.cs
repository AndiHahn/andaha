using Andaha.Services.Shopping.Requests.Bill.LineItems;

namespace Andaha.Services.Shopping.Tests.Bill;

public class LineItemSanitizerTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t\n")]
    public void Item_without_description_is_dropped(string? description)
    {
        var result = LineItemSanitizer.Sanitize(new (string?, int?, double?, double?)[]
        {
            ("Milch", 1, 1.29, 1.29),
            (description, 2, 1.0, 2.0),
            ("Brot", null, null, 2.49),
        });

        Assert.Equal(new[] { "Milch", "Brot" }, result.Select(item => item.Description));
    }

    [Fact]
    public void Description_is_trimmed_and_cut_to_200_characters()
    {
        string longDescription = new('a', 250);

        var result = LineItemSanitizer.Sanitize(new (string?, int?, double?, double?)[]
        {
            ("  Äpfel  ", 1, 2.5, 2.5),
            (longDescription, 1, 1.0, 1.0),
        });

        Assert.Equal("Äpfel", result[0].Description);
        Assert.Equal(200, result[1].Description.Length);
        Assert.Equal(new string('a', 200), result[1].Description);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Quantity_zero_or_negative_becomes_null(int quantity)
    {
        var item = Assert.Single(LineItemSanitizer.Sanitize(new (string?, int?, double?, double?)[]
        {
            ("Pfand", quantity, 0.25, 0.25),
        }));

        Assert.Null(item.Quantity);
    }

    [Fact]
    public void Negative_price_is_kept()
    {
        var item = Assert.Single(LineItemSanitizer.Sanitize(new (string?, int?, double?, double?)[]
        {
            ("Rabatt", 1, -0.50, -0.50),
        }));

        Assert.Equal(new LineItemData("Rabatt", 1, -0.50, -0.50), item);
    }

    [Fact]
    public void Order_of_the_remaining_items_is_kept()
    {
        var result = LineItemSanitizer.Sanitize(new (string?, int?, double?, double?)[]
        {
            ("C", 3, null, null),
            ("", 1, null, null),
            ("A", 1, null, null),
            ("B", 2, null, null),
        });

        Assert.Equal(new[] { "C", "A", "B" }, result.Select(item => item.Description));
    }
}
