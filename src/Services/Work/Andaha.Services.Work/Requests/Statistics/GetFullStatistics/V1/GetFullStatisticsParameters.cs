namespace Andaha.Services.Work.Requests.Statistics.GetFullStatistics.V1;

public record GetFullStatisticsParameters
{
    public required DateTime StartTimeUtc { get; init; }
    public required DateTime EndTimeUtc { get; init; }
}
