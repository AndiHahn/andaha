namespace Andaha.Services.Work.Requests.Statistics.GetStatistics.V1;

public record GetStatisticsParameters
{
    public required DateTime StartTimeUtc { get; init; }
    public required DateTime EndTimeUtc { get; init; }

    /// <summary>
    /// Optional person ids. Empty or missing means all own and connected persons.
    /// </summary>
    public Guid[]? PersonFilter { get; init; }
}
