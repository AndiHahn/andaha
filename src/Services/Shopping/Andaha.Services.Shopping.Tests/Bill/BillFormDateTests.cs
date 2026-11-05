using Andaha.Services.Shopping.Requests.Bill;

namespace Andaha.Services.Shopping.Tests.Bill;

/// <summary>
/// The bill date is the local wall time of the user (the calendar day picked in the app). It must be stored
/// unchanged, independent of the server time zone: a bill at 23:30 stays on its day.
/// </summary>
public class BillFormDateTests
{
    [Theory]
    [InlineData("2026-11-05T23:30:00.000")]
    [InlineData("2026-11-05T23:30:00")]
    // older app versions send the wall time with a "Z" (moment.utc(true))
    [InlineData("2026-11-05T23:30:00.000Z")]
    public void Late_evening_bill_keeps_its_day_and_time(string formValue)
    {
        var date = BillFormDate.Parse(formValue);

        Assert.Equal(new DateTime(2026, 11, 5, 23, 30, 0), date);
    }

    [Fact]
    public void First_of_month_shortly_after_midnight_stays_in_its_month()
    {
        var date = BillFormDate.Parse("2026-12-01T00:30:00.000");

        Assert.Equal(new DateTime(2026, 12, 1, 0, 30, 0), date);
    }
}
