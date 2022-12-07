namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record SearchBillsParameters(int PageSize, int PageIndex, string? Search);