namespace Andaha.Services.Shopping.Dtos;

public record SearchBillsParameters(int PageSize, int PageIndex, string? Search);