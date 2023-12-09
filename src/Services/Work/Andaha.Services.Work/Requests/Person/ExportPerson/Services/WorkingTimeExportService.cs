using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Common;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Person.ExportPerson.Services;

internal class WorkingTimeExportService : IExportService
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public WorkingTimeExportService(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task WriteWorkSheetAsync(XLWorkbook workBook, CancellationToken cancellationToken)
    {
        var exportData = await GetExportDataAsync(cancellationToken);

        WriteWorksheet(exportData, workBook);
    }

    private static void WriteWorksheet(
        IReadOnlyCollection<WorkingTimeExportRow> data,
        XLWorkbook workBook)
    {
        var worksheet = workBook.Worksheets.Add("Arbeitszeiten");

        // Write headline
        worksheet.Cell("A1").Value = "Arbeitszeiten";
        worksheet.Cell("A2").Value = $"{data.Count} Einträge";

        worksheet.Cell("A1").Style.Font.FontSize = 20;
        worksheet.Cell("A2").Style.Font.FontSize = 10;

        // Write content
        CommonExportService.WriteHeader(
            worksheet,
            4,
            new string[] { "Name", "Datum", "Von", "Bis", "Pause", "Arbeitszeit", "Notiz" });

        worksheet.Cell("A5").InsertData(data);

        worksheet.Columns("B:F").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        worksheet.Columns().AdjustToContents(startRow: 4, minWidth: 10,71);
    }

    private async Task<IReadOnlyCollection<WorkingTimeExportRow>> GetExportDataAsync(CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var info = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");
        DateTimeOffset localServerTime = DateTimeOffset.Now;
        DateTimeOffset CETTime = TimeZoneInfo.ConvertTime(localServerTime, info);

        var persons = await dbContext.WorkingEntry
            .AsNoTracking()
            .Where(entry =>
                (entry.Person.UserId == userId ||
                connectedUsers.Contains(entry.Person.UserId)))
            .OrderBy(entry => entry.From)
            .Select(entry => new WorkingTimeExportRow
            {
                Name = entry.Person.Name,
                Date = entry.From.ToString("dd.MM.yyyy"),
                From = entry.From.ToString("HH:ss"),
                Until = entry.Until.ToString("HH:ss"),
                Break = entry.Break.ToFormattedString(),
                WorkDuration = new TimeSpan(entry.WorkDurationTicks).ToFormattedString(),
                Notes = entry.Notes
            })
            .ToListAsync(cancellationToken);

        return persons;
    }
}
