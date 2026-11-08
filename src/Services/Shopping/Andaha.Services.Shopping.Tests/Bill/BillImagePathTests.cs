using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

namespace Andaha.Services.Shopping.Tests.Bill;

public class BillImagePathTests
{
    [Theory]
    [InlineData("Billa Plus", "Billa-Plus")]
    [InlineData("Müller & Söhne / Filiale 3", "Mueller-Soehne-Filiale-3")]
    [InlineData("  ", "Unbekannt")]
    [InlineData(null, "Unbekannt")]
    [InlineData("Café Crème", "Cafe-Creme")]
    [InlineData("Straße", "Strasse")]
    [InlineData("--A--", "A")]
    [InlineData("Billa  Plus!", "Billa-Plus")]
    public void ShopSlug_NormalizesName(string? input, string expected)
        => Assert.Equal(expected, BillImagePath.ShopSlug(input));

    [Fact]
    public void ShopSlug_LongName_IsCutToFortyWithoutTrailingDash()
    {
        var slug = BillImagePath.ShopSlug(new string('a', 39) + " " + new string('b', 20));
        Assert.Equal(39, slug.Length);
        Assert.False(slug.EndsWith('-'));

        var plain = BillImagePath.ShopSlug(new string('x', 60));
        Assert.Equal(40, plain.Length);
    }

    [Fact]
    public void ForBill_BuildsStructuredPath()
    {
        var u = Guid.NewGuid();
        var b = Guid.NewGuid();
        var path = BillImagePath.ForBill(u, new DateTime(2026, 11, 6), "Billa Plus", b, 1, ".jpg");
        Assert.Equal($"{u:D}/2026/11/2026-11-06_Billa-Plus_{b:D}-1.jpg", path);
    }

    [Fact]
    public void ForScan_BuildsOpenPath()
    {
        var u = Guid.NewGuid();
        var a = Guid.NewGuid();
        var path = BillImagePath.ForScan(u, new DateTime(2026, 11, 8, 9, 14, 3, DateTimeKind.Utc), a, ".png");
        Assert.Equal($"{u:D}/offen/2026-11-08_09-14-03_{a:D}-1.png", path);
    }

    [Fact]
    public void IsLegacy_DependsOnSlash()
    {
        Assert.True(BillImagePath.IsLegacy("abc-1"));
        Assert.False(BillImagePath.IsLegacy("u/2026/11/x.jpg"));
    }

    [Fact]
    public void ExtensionOf_ReturnsExtensionOrEmptyForLegacy()
    {
        Assert.Equal(".jpg", BillImagePath.ExtensionOf("u/2026/11/x-1.jpg"));
        Assert.Equal("", BillImagePath.ExtensionOf("abc-1"));
    }
}
