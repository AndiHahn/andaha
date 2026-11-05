namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record BillSearchResultDto(
    IReadOnlyCollection<BillDto> Values,
    int TotalCount,
    double TotalSum,
    IReadOnlyCollection<MonthSumDto> MonthSums);
