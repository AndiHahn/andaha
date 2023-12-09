using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Common;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Person.ExportPerson.Services;

internal class PaymentExportService : IExportService
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public PaymentExportService(
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
        IReadOnlyCollection<PaymentExportRow> data,
        XLWorkbook workBook)
    {
        var worksheet = workBook.Worksheets.Add("Zahlungen");

        // Write headline
        worksheet.Cell("A1").Value = "Zahlungen";
        worksheet.Cell("A2").Value = $"{data.Count} Einträge";

        worksheet.Cell("A1").Style.Font.FontSize = 20;
        worksheet.Cell("A2").Style.Font.FontSize = 10;

        // Write content
        CommonExportService.WriteHeader(
            worksheet,
            4,
            new string[] { "Name", "Bezahlt am", "Bezahlte Stunden", "Bezahltes Geld", "Trinkgeld", "Notiz" });

        worksheet.Cell("A5").InsertData(data);

        worksheet.Columns("B:E").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        worksheet.Columns().AdjustToContents(startRow: 4, minWidth: 10, 71);
    }

    private async Task<IReadOnlyCollection<PaymentExportRow>> GetExportDataAsync(CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var info = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");
        DateTimeOffset localServerTime = DateTimeOffset.Now;
        DateTimeOffset CETTime = TimeZoneInfo.ConvertTime(localServerTime, info);

        var persons = await dbContext.Payment
            .AsNoTracking()
            .Where(entry =>
                (entry.Person.UserId == userId ||
                connectedUsers.Contains(entry.Person.UserId)))
            .OrderBy(entry => entry.PayedAt)
            .Select(entry => new PaymentExportRow
            {
                Name = entry.Person.Name,
                PayedAt = entry.PayedAt,
                PayedHours = new TimeSpan(entry.PayedHoursTicks).ToFormattedString(),
                PayedMoney = entry.PayedMoney,
                PayedTip = entry.PayedTip,
                Note = entry.Notes
            })
            .ToListAsync(cancellationToken);

        return persons;
    }
}
