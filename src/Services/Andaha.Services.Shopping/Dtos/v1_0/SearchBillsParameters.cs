namespace Andaha.Services.Shopping.Dtos.v1_0;

public record SearchBillsParameters(int PageSize, int PageIndex, string? Search);