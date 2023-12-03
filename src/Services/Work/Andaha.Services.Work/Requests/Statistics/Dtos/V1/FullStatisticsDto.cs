namespace Andaha.Services.Work.Requests.Statistics.Dtos.V1;

public record FullStatisticsDto(
    TimeSpan TotalWorkingTime,
    double PayedMoney,
    TimeSpan NotPayedHours,
    double NotPayedMoney);
