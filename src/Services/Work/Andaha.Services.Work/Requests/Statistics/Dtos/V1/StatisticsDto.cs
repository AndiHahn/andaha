namespace Andaha.Services.Work.Requests.Statistics.Dtos.V1;

public record StatisticsDto(
    TimeSpan TotalWorkingTime,
    double ExtrapolatedMoneyToPay);
