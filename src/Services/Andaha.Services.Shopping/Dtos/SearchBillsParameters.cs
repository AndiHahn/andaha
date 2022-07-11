namespace Andaha.Services.Shopping.Dtos;

public readonly record struct SearchBillsParameters(int PageSize, int PageIndex, string? Search);