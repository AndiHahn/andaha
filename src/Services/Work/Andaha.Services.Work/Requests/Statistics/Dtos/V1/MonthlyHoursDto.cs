namespace Andaha.Services.Work.Requests.Statistics.Dtos.V1;

/// <param name="Month">Month in the format yyyy-MM.</param>
/// <param name="Hours">Net working hours of the month (counted by the start of the entry).</param>
public record MonthlyHoursDto(string Month, double Hours);
