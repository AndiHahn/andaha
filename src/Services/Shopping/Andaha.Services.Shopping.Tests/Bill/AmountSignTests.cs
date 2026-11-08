using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;

namespace Andaha.Services.Shopping.Tests.Bill;

public class AmountSignTests
{
    [Fact]
    public void TrailingMinus_negates_total_only()
    {
        var (total, unit) = AmountSign.Apply(1.00, null, "1,00-");
        Assert.Equal(-1.00, total);
        Assert.Null(unit);
    }

    [Fact]
    public void LeadingMinus_negates_total_and_positive_unit()
    {
        var (total, unit) = AmountSign.Apply(1.00, 1.00, "-1,00");
        Assert.Equal(-1.00, total);
        Assert.Equal(-1.00, unit);
    }

    [Fact]
    public void UnicodeMinus_with_negative_total_keeps_sign_and_negates_unit()
    {
        var (total, unit) = AmountSign.Apply(-1.00, 1.00, "\u22121,00");
        Assert.Equal(-1.00, total);
        Assert.Equal(-1.00, unit);
    }

    [Fact]
    public void NegativeValue_without_text_stays_negative()
    {
        var (total, unit) = AmountSign.Apply(-2.00, 2.00, null);
        Assert.Equal(-2.00, total);
        Assert.Equal(-2.00, unit);
    }

    [Fact]
    public void PositiveAmount_is_unchanged()
    {
        var (total, unit) = AmountSign.Apply(3.50, 3.50, "3,50");
        Assert.Equal(3.50, total);
        Assert.Equal(3.50, unit);
    }

    [Fact]
    public void NullTotal_gives_null_total()
    {
        var (total, unit) = AmountSign.Apply(null, 1.0, "1,00-");
        Assert.Null(total);
        Assert.Equal(1.0, unit);
    }
}
