using Andaha.Services.Work.Requests.WorkingEntry.CreateWorkingEntries.V1;
using Andaha.Services.Work.Requests.WorkingEntry.CreateWorkingEntry.V1;
using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using Andaha.Services.Work.Requests.WorkingEntry.UpdateWorkingEntry.V1;
using FluentValidation.Results;

namespace Andaha.Services.Work.Tests.WorkingEntry;

public class WorkingEntryValidationTests
{
    private static readonly DateTime From = new(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc);

    private static ValidationResult ValidateCreate(DateTime until, TimeSpan @break)
        => new CreateWorkingEntryRequestValidator().Validate(
            new CreateWorkingEntryRequest(new CreateWorkingEntryDto(Guid.NewGuid(), From, until, @break, null)));

    private static ValidationResult ValidateBulk(DateTime until, TimeSpan @break)
        => new CreateWorkingEntriesRequestValidator().Validate(
            new CreateWorkingEntriesRequest(new CreateWorkingEntriesDto([Guid.NewGuid()], From, until, @break, null)));

    private static ValidationResult ValidateUpdate(DateTime until, TimeSpan @break)
        => new UpdateWorkingEntryRequestValidator().Validate(
            new UpdateWorkingEntryRequest(Guid.NewGuid(), new UpdateWorkingEntryDto(From, until, @break, null)));

    private static void AssertOnlyErrorAt(ValidationResult result, string propertyName)
    {
        Assert.False(result.IsValid);
        Assert.All(result.Errors, error => Assert.Equal(propertyName, error.PropertyName));
    }

    [Fact]
    public void Create_rejects_until_before_from()
    {
        AssertOnlyErrorAt(ValidateCreate(From.AddHours(-1), TimeSpan.Zero), "Until");
        AssertOnlyErrorAt(ValidateCreate(From, TimeSpan.Zero), "Until");
        AssertOnlyErrorAt(ValidateBulk(From.AddHours(-1), TimeSpan.Zero), "Until");
        AssertOnlyErrorAt(ValidateBulk(From, TimeSpan.Zero), "Until");

        Assert.True(ValidateCreate(From.AddHours(2), TimeSpan.FromMinutes(30)).IsValid);
        Assert.True(ValidateBulk(From.AddHours(2), TimeSpan.FromMinutes(30)).IsValid);
    }

    [Fact]
    public void Update_rejects_until_before_from()
    {
        AssertOnlyErrorAt(ValidateUpdate(From.AddHours(-1), TimeSpan.Zero), "Until");
        AssertOnlyErrorAt(ValidateUpdate(From, TimeSpan.Zero), "Until");
        AssertOnlyErrorAt(ValidateUpdate(From.AddHours(2), TimeSpan.FromHours(2)), "Break");
        Assert.True(ValidateUpdate(From.AddHours(2), TimeSpan.FromMinutes(30)).IsValid);

        var entry = new Core.WorkingEntry(
            new Core.Person(Guid.NewGuid(), "Maria", 15, null),
            From,
            From.AddHours(2),
            TimeSpan.Zero,
            null);

        Assert.Throws<ArgumentException>(() => entry.Update(From, From.AddHours(-1), TimeSpan.Zero, null));
        Assert.Throws<ArgumentException>(() => entry.Update(until: From.AddHours(-1)));
        Assert.Throws<ArgumentException>(() => new Core.WorkingEntry(entry.Person, From, From.AddHours(-1), TimeSpan.Zero, null));
        Assert.Equal(From.AddHours(2), entry.Until);
    }

    [Fact]
    public void Create_rejects_break_longer_than_duration()
    {
        var until = From.AddHours(2);

        AssertOnlyErrorAt(ValidateCreate(until, TimeSpan.FromHours(3)), "Break");
        AssertOnlyErrorAt(ValidateCreate(until, TimeSpan.FromHours(2)), "Break");
        AssertOnlyErrorAt(ValidateBulk(until, TimeSpan.FromHours(3)), "Break");
        AssertOnlyErrorAt(ValidateBulk(until, TimeSpan.FromHours(2)), "Break");

        Assert.True(ValidateCreate(until, TimeSpan.FromMinutes(119)).IsValid);
    }
}
