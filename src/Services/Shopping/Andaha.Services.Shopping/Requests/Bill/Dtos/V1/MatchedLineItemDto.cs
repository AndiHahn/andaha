namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

/// <summary>
/// The first line item (by position) of a bill that matches the active search term.
/// </summary>
public record MatchedLineItemDto(string Description, double? TotalPrice);
