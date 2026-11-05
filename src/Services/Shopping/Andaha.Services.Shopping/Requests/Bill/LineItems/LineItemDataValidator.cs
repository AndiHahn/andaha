using FluentValidation;

namespace Andaha.Services.Shopping.Requests.Bill.LineItems;

/// <summary>
/// Rules for one line item of a create/update request (US-0009 §5.1); prices may be anything.
/// The create/update validators add the count rule (<see cref="HasAllowedCount"/>) and apply this validator to each item.
/// </summary>
internal sealed class LineItemDataValidator : AbstractValidator<LineItemData>
{
    public const string TooManyItemsMessage = "Es sind höchstens 200 Positionen erlaubt.";

    public LineItemDataValidator()
    {
        RuleFor(item => item.Description)
            .Must(description => !string.IsNullOrWhiteSpace(description))
            .WithMessage("Die Beschreibung darf nicht leer sein.")
            .Must(description => description is null || description.Trim().Length <= LineItemData.MaxDescriptionLength)
            .WithMessage($"Die Beschreibung darf höchstens {LineItemData.MaxDescriptionLength} Zeichen haben.");

        RuleFor(item => item.Quantity)
            .GreaterThanOrEqualTo(1)
            .When(item => item.Quantity is not null);
    }

    public static bool HasAllowedCount(IReadOnlyList<LineItemData>? items)
        => items is null || items.Count <= LineItemData.MaxCount;
}
