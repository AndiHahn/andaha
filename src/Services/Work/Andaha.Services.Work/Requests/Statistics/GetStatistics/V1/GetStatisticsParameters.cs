namespace Andaha.Services.Work.Requests.Statistics.GetStatistics.V1;

public record GetStatisticsParameters
{
    public required DateTime StartTimeUtc { get; init; }
    public required DateTime EndTimeUtc { get; init; }
}
